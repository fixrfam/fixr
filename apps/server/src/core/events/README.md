# Domain events

Some changes have consequences outside the module that makes them: when a
service order changes status, the device moves too; later, parts will leave
the inventory when an order is approved. Writing those consequences inside the
service that changes the order couples every module to every other one and
hides them where nobody looks.

Instead, the module that owns the data **emits an event** (a fact, in the past
tense) and the modules that care **register effects** on it.

```
ServiceOrdersService.changeStatus
  └─ inTransaction(tx)
       └─ moveServiceOrder(tx, ...)
            ├─ ServiceOrdersRepository.updateStatus(tx, ...)
            ├─ ServiceOrdersRepository.insertStatusHistory(tx, ...)
            └─ emit "serviceOrder.statusChanged" { from, to, employeeId, ... }
            ├─ devices.followServiceOrder   → DevicesRepository.updateDevice(..., tx)
            └─ (inventory.consumeParts      → later)

EstimatesService (customer approves)
  └─ inTransaction(tx)
       ├─ EstimatesRepository.recordAnswer(tx, ...)
       └─ events.emit(tx, "estimate.approved", ...)
            └─ serviceOrders.approve → moveServiceOrder(...)
                 └─ emit "serviceOrder.statusChanged" → devices.followServiceOrder, ...
```

## How it works

- **In process and synchronous.** `events.emit` runs the event's effects one
  after the other, in registration order, and resolves when all of them are
  done. No queue, no worker, no retries.
- **In the same transaction.** The emitter passes its `tx`; effects write
  through it. Everything commits together or not at all: an effect that throws
  (e.g. an `AppError` for "not enough stock") rolls back the change that
  emitted the event, and the API answers with that error.
- **Typed.** Event names and payloads live in [`catalog.ts`](./catalog.ts).
  Emitting an unknown event, or the wrong payload, doesn't compile.
- **Chains are allowed.** An effect can `emit` a follow-up event through its
  context (same transaction). A chain deeper than 8 levels is treated as a
  loop and throws.

## Events

| Event | Emitted by | When | Effects |
| --- | --- | --- | --- |
| `serviceOrder.opened` | `ServiceOrdersService.createServiceOrder` | A service order was opened for a device | `devices.checkIn`: the device is `in_shop` |
| `estimate.sent` | `EstimatesService` (send by email, or staff marks as sent) | An estimate was sent to the customer | `serviceOrders.awaitApproval`: the order goes to `waiting_approval` if it wasn't answered yet, recorded as moved by who sent it |
| `estimate.approved` | `EstimatesService.recordAnswer` (staff, emailed link or customer portal) | An estimate was approved | `serviceOrders.approve`: the order goes to `approved` if it wasn't answered yet, by the staff member or, from the customer's link or portal, by nobody |
| `serviceOrder.statusChanged` | `moveServiceOrder` (used by `ServiceOrdersService.changeStatus`) | The order moved to another status (not emitted when the status is the same) | `devices.followServiceOrder`: `ready` → `ready_for_pickup`, `delivered` → `with_customer`, anything else → `in_shop` |

Keep this table up to date: it is the map of what happens when.

## Changing a service order's status

Always through `moveServiceOrder` (`modules/service-orders/services/move-status.ts`).
It locks the order, updates it, records the change in the order's history
(`service_order_history`: who moved it, or nobody when the system did,
and the optional note) and emits `serviceOrder.statusChanged` in the caller's
transaction, so the history and the effects of a status change happen no
matter who moves the order: the API (`ServiceOrdersService.changeStatus`) or an
effect of another event. Writing `service_orders.status` anywhere else skips
them.

The history is the service orders module's own data, so it's written there
and not by an effect (see "When not to use it").

## Adding an event

1. Describe it in `catalog.ts`: name `<entity>.<pastTenseVerb>`, a JSDoc line
   saying what happened, and a payload with ids and the values effects need
   (e.g. `from`/`to`). Not whole records: effects load what else they need in
   the transaction.
2. Emit it from the **service** of the module that owns the data, right after
   the write it describes, inside `inTransaction`:

   ```ts
   await inTransaction(async (tx) => {
   	await EstimatesRepository.approve(tx, estimateId);
   	await events.emit(tx, "estimate.approved", { estimateId, serviceOrderId, companyId, employeeId });
   });
   ```

   Repositories never emit: they only read and write.
3. Add a row to the table above.

## Adding an effect

1. In the module that reacts, create or extend `effects/index.ts` with a
   `register<Module>Effects(bus: EventBus)` function:

   ```ts
   export function registerInventoryEffects(bus: EventBus) {
   	bus.on("serviceOrder.statusChanged", "inventory.consumeParts", async ({ serviceOrderId, to }, { tx }) => {
   		if (to !== "approved") return;
   		await PartsRepository.consumeForServiceOrder(serviceOrderId, tx);
   	});
   }
   ```

   Name effects `<module>.<whatItDoes>`; the name shows in errors and in the
   table.
2. Write through `tx` (repositories take it as an argument). Don't open
   another transaction and don't call another module's service: effects are
   small and only touch their own module's data.
3. Register the module in [`register.ts`](./register.ts). Registration order
   is execution order.
4. Test it like `modules/devices/effects/index.spec.ts`: a fresh `EventBus`,
   `register<Module>Effects(bus)`, `bus.emit(...)`, and assertions on the
   mocked repository. The integration suite covers the whole chain.

## When not to use it

- **Validation and reads.** If the caller must know something before deciding
  (e.g. "is this device the company's?"), call a repository; events are for
  consequences after a write.
- **Slow or external work** (emails, PDFs, webhooks). Effects run inside the
  request and the transaction. Enqueue a BullMQ job (`apps/workers`) instead;
  if it has to wait for the commit, enqueue it after `inTransaction` returns.
- **A single module's own steps.** Inserting an order and its photos is one
  write of one module: keep it in the repository.
