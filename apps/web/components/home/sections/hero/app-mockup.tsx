"use client";

import { useTranslation } from "@fixr/i18n/react";
import {
	ArrowLeft,
	Bell,
	Building2,
	Check,
	ChevronDown,
	ChevronUp,
	Clipboard,
	ClipboardList,
	Clock,
	ContactRound,
	FileUser,
	GripVertical,
	HandCoins,
	History,
	Home,
	Image as ImageIcon,
	KeyRound,
	Languages,
	type LucideIcon,
	MessageCircleQuestion,
	MonitorSmartphone,
	Moon,
	Package,
	PanelLeft,
	Puzzle,
	Search,
	Settings,
	Shield,
	Sun,
	User,
	Users,
	Warehouse,
	Wrench,
} from "lucide-react";
import type { CSSProperties, ReactNode } from "react";
import { Logo } from "@/components/svg/logo";
import { cn } from "@/lib/utils";
import { IsoScene } from "../../iso/iso";

/** Sample records shown in the drawing. They are data, so they stay as is in every locale. */
const DEMO = {
	company: "Acme",
	user: "Admin",
	email: "ricardoamorimfa...",
	orderNumber: "60918",
	receivedAt: "04/05/2026",
	imei: "543210987654321",
	brand: "Samsung",
	model: "Galaxy S21",
	technician: "Ana Costa",
	client: "Carlos Eduardo",
	document: "987.654.321-00",
	phone: "(21) 98888-8888",
	entryOneAt: "04/05/2026 09:00",
	entryTwoAt: "04/05/2026 14:00",
	entryThreeAt: "06/05/2026 10:20",
	quantity: "1x",
} as const;

const W = 1541;
const H = 1030;

const LEFT = { x: 325, w: 615 } as const;
const RIGHT = { x: 989, w: 504 } as const;

interface TextProps {
	x: number;
	y: number;
	size?: number;
	weight?: number;
	tone?: "foreground" | "muted" | "primary";
	anchor?: "start" | "middle" | "end";
	heading?: boolean;
	className?: string;
	children: ReactNode;
}

function Text({
	x,
	y,
	size = 13,
	weight = 400,
	tone = "foreground",
	anchor = "start",
	heading = false,
	className,
	children,
}: TextProps) {
	return (
		<text
			className={cn(
				tone === "foreground" && "fill-foreground",
				tone === "muted" && "fill-muted-foreground",
				tone === "primary" && "fill-primary",
				className
			)}
			fontSize={size}
			fontWeight={weight}
			style={{
				fontFamily: heading ? "var(--font-cal)" : "var(--font-inter)",
			}}
			textAnchor={anchor}
			x={x}
			y={y}
		>
			{children}
		</text>
	);
}

function Icon({
	icon: Glyph,
	x,
	y,
	size = 14,
	className = "text-muted-foreground",
}: {
	icon: LucideIcon;
	x: number;
	y: number;
	size?: number;
	className?: string;
}) {
	return <Glyph className={className} height={size} width={size} x={x} y={y} />;
}

function NavItem({
	icon,
	label,
	y,
	indent = false,
	chevron,
}: {
	icon: LucideIcon;
	label: string;
	y: number;
	indent?: boolean;
	chevron?: "up" | "down";
}) {
	const x = indent ? 47 : 26;
	return (
		<g>
			<Icon icon={icon} x={x} y={y - 7} />
			<Text x={x + 22} y={y + 5}>
				{label}
			</Text>
			{chevron && (
				<Icon
					icon={chevron === "up" ? ChevronUp : ChevronDown}
					x={242}
					y={y - 7}
				/>
			)}
		</g>
	);
}

function DragButton({ right, y }: { right: number; y: number }) {
	const { t } = useTranslation();
	return (
		<g>
			<rect
				className="fill-background stroke-border"
				height={24}
				rx={8}
				width={75}
				x={right - 75}
				y={y}
			/>
			<Icon icon={GripVertical} size={11} x={right - 67} y={y + 6.5} />
			<Text size={12.5} tone="muted" x={right - 50} y={y + 16.5}>
				{t("serviceOrders.layout.drag")}
			</Text>
		</g>
	);
}

interface CardProps {
	x: number;
	y: number;
	w: number;
	h: number;
	icon: LucideIcon;
	title: string;
	description: string;
	index: number;
	children?: ReactNode;
}

/** Same anatomy as the dashboard's service order cards: header, divider, body. */
function Card({
	x,
	y,
	w,
	h,
	icon,
	title,
	description,
	index,
	children,
}: CardProps) {
	return (
		<g
			className="mock-card"
			style={{ "--delay": `${0.5 + index * 0.08}s` } as CSSProperties}
		>
			<rect
				className="fill-background stroke-border"
				height={h}
				rx={10}
				width={w}
				x={x + 0.5}
				y={y + 0.5}
			/>
			<Icon icon={icon} x={x + 18} y={y + 17} />
			<Text weight={500} x={x + 45} y={y + 27}>
				{title}
			</Text>
			<Text tone="muted" x={x + 45} y={y + 45}>
				{description}
			</Text>
			<DragButton right={x + w - 12} y={y + 13} />
			<line
				className="stroke-border"
				x1={x + 1}
				x2={x + w}
				y1={y + 61}
				y2={y + 61}
			/>
			{children}
		</g>
	);
}

function Field({
	x,
	right,
	y,
	label,
	value,
	strong = false,
}: {
	x: number;
	right: number;
	y: number;
	label: string;
	value?: string;
	strong?: boolean;
}) {
	return (
		<g>
			<Text tone="muted" x={x} y={y}>
				{label}
			</Text>
			{value && (
				<Text anchor="end" weight={strong ? 600 : 500} x={right} y={y}>
					{value}
				</Text>
			)}
		</g>
	);
}

type Phase = "finished" | "inProgress" | "pending";

const BADGE_WIDTH: Record<Phase, number> = {
	finished: 78,
	inProgress: 98,
	pending: 74,
};

function PhaseBadge({
	phase,
	right,
	y,
}: {
	phase: Phase;
	right: number;
	y: number;
}) {
	const { t } = useTranslation();
	const label = t(`serviceOrders.phase.${phase}`);
	const width = BADGE_WIDTH[phase];
	return (
		<g>
			<rect
				className={cn(
					phase === "finished" ? "fill-green-500/15" : "fill-primary/20"
				)}
				height={19}
				rx={9.5}
				width={width}
				x={right - width}
				y={y}
			/>
			<Text
				anchor="middle"
				className={cn(
					phase === "finished" && "fill-green-600 dark:fill-green-400",
					phase === "inProgress" && "fill-primary dark:fill-primary-400",
					phase === "pending" && "fill-primary/70"
				)}
				size={12.5}
				tone="muted"
				weight={500}
				x={right - width / 2}
				y={y + 14}
			>
				{label}
			</Text>
		</g>
	);
}

function Entry({
	y,
	at,
	text,
	live = false,
}: {
	y: number;
	at: string;
	text: string;
	live?: boolean;
}) {
	return (
		<g>
			<circle
				className={cn(
					live ? "iso-anim mock-blink fill-primary" : "fill-muted-foreground/50"
				)}
				cx={411}
				cy={y - 1}
				r={3}
			/>
			<Text size={12.5} tone="muted" x={431} y={y + 1}>
				{at}
			</Text>
			<Text x={431} y={y + 18}>
				{text}
			</Text>
		</g>
	);
}

function Step({
	y,
	title,
	description,
	phase,
	children,
}: {
	y: number;
	title: string;
	description: string;
	phase: Phase;
	children?: ReactNode;
}) {
	return (
		<g>
			{phase === "finished" && (
				<>
					<circle className="fill-green-500" cx={360} cy={y} r={18} />
					<Icon
						className="text-white"
						icon={Check}
						size={20}
						x={350}
						y={y - 10}
					/>
				</>
			)}
			{phase === "inProgress" && (
				<>
					<circle
						className="iso-anim mock-ring fill-none stroke-primary"
						cx={360}
						cy={y}
						r={21}
						strokeWidth={2}
					/>
					<circle
						className="fill-none stroke-primary"
						cx={360}
						cy={y}
						r={21}
						strokeWidth={1.5}
					/>
					<circle className="fill-primary" cx={360} cy={y} r={17} />
					<Icon
						className="text-white"
						icon={Clock}
						size={18}
						x={351}
						y={y - 9}
					/>
				</>
			)}
			{phase === "pending" && (
				<circle className="fill-primary/45" cx={360} cy={y} r={18} />
			)}
			{children}
			<Text size={14} weight={600} x={390} y={y - 2}>
				{title}
			</Text>
			<Text tone="muted" x={390} y={y + 18}>
				{description}
			</Text>
			<PhaseBadge phase={phase} right={922} y={y - 17} />
		</g>
	);
}

/**
 * The service order screen of the dashboard, redrawn as SVG so it stays sharp,
 * follows the theme and the language, and can move a little.
 */
export function AppMockup() {
	const { t } = useTranslation();
	const leftRight = LEFT.x + LEFT.w - 17;
	const rightRight = RIGHT.x + RIGHT.w - 17;

	return (
		<IsoScene
			className="overflow-hidden"
			label={t("home.hero.scene")}
			viewBox={`0 0 ${W} ${H}`}
		>
			<rect className="fill-background" height={H} width={W} />

			{/* Sidebar */}
			<g>
				<Logo className="text-primary" height={30} width={30} x={15} y={17} />
				<Icon icon={PanelLeft} size={15} x={240} y={24} />

				<rect
					className="fill-primary"
					height={35}
					rx={7}
					width={35}
					x={18}
					y={65}
				/>
				<rect
					className="fill-primary-300/60"
					height={35}
					rx={7}
					width={17}
					x={18}
					y={65}
				/>
				<Text weight={500} x={66} y={79}>
					{DEMO.company}
				</Text>
				<Text size={12} tone="muted" x={66} y={96}>
					{t("dashboard.sidebar.myCompany")}
				</Text>

				<rect
					className="fill-card stroke-border"
					height={33}
					rx={8}
					width={245}
					x={18.5}
					y={117.5}
				/>
				<Icon icon={Search} size={13} x={31} y={128} />
				<Text weight={500} x={51} y={139}>
					{t("dashboard.sidebar.quickAccess")}
				</Text>
				{[205, 231].map((x, index) => (
					<g key={x}>
						<rect
							className="fill-muted stroke-border"
							height={18}
							rx={4}
							width={19}
							x={x}
							y={125}
						/>
						<Text anchor="middle" size={11} tone="muted" x={x + 9.5} y={138}>
							{index === 0 ? "⌘" : "K"}
						</Text>
					</g>
				))}

				<Text size={12} tone="muted" weight={500} x={26} y={184}>
					{t("dashboard.sidebar.sections.system")}
				</Text>
				<NavItem icon={Home} label={t("dashboard.nav.home")} y={206} />
				<NavItem icon={Bell} label={t("dashboard.nav.notifications")} y={236} />
				<NavItem
					chevron="up"
					icon={Settings}
					label={t("dashboard.nav.settings")}
					y={266}
				/>
				<line className="stroke-border" x1={34} x2={34} y1={282} y2={398} />
				<NavItem
					icon={User}
					indent
					label={t("dashboard.nav.profile")}
					y={296}
				/>
				<NavItem
					icon={Building2}
					indent
					label={t("dashboard.nav.company")}
					y={326}
				/>
				<NavItem
					icon={Shield}
					indent
					label={t("dashboard.nav.security")}
					y={356}
				/>
				<NavItem
					icon={KeyRound}
					indent
					label={t("dashboard.nav.apiKeys")}
					y={386}
				/>

				<Text size={12} tone="muted" weight={500} x={26} y={434}>
					{t("dashboard.sidebar.sections.modules")}
				</Text>
				<NavItem
					icon={Clipboard}
					label={t("dashboard.nav.serviceOrders")}
					y={456}
				/>
				<NavItem
					icon={HandCoins}
					label={t("dashboard.nav.estimates")}
					y={486}
				/>
				<NavItem icon={Package} label={t("dashboard.nav.suppliers")} y={516} />
				<NavItem icon={Puzzle} label={t("dashboard.nav.parts")} y={546} />
				<NavItem icon={Wrench} label={t("dashboard.nav.services")} y={576} />
				<NavItem
					icon={Warehouse}
					label={t("dashboard.nav.inventory")}
					y={606}
				/>
				<NavItem
					icon={MessageCircleQuestion}
					label={t("dashboard.nav.support")}
					y={636}
				/>
				<NavItem icon={Users} label={t("dashboard.nav.customers")} y={666} />
				<NavItem
					chevron="down"
					icon={MonitorSmartphone}
					label={t("dashboard.nav.devices")}
					y={696}
				/>

				<Text size={12} tone="muted" weight={500} x={26} y={744}>
					{t("dashboard.sidebar.sections.company")}
				</Text>
				<NavItem
					icon={ContactRound}
					label={t("dashboard.nav.employees")}
					y={766}
				/>

				<rect
					className="fill-primary-200"
					height={35}
					rx={8}
					width={35}
					x={15}
					y={982}
				/>
				<Text weight={500} x={66} y={996}>
					{DEMO.user}
				</Text>
				<Text size={12} tone="muted" x={66} y={1013}>
					{DEMO.email}
				</Text>
				<Icon
					className="text-foreground"
					icon={Languages}
					size={15}
					x={209}
					y={991}
				/>
				<Icon
					className="hidden text-foreground dark:inline"
					icon={Moon}
					size={15}
					x={243}
					y={991}
				/>
				<Icon
					className="text-foreground dark:hidden"
					icon={Sun}
					size={15}
					x={243}
					y={991}
				/>
			</g>

			{/* Main panel */}
			<rect
				className="fill-card stroke-border"
				height={H + 20}
				rx={12}
				width={1248}
				x={285.5}
				y={8.5}
			/>

			<Icon
				className="text-foreground"
				icon={ArrowLeft}
				size={14}
				x={324}
				y={36}
			/>
			<Text weight={500} x={345} y={48}>
				{t("common.actions.back")}
			</Text>
			<Icon
				className="fill-primary text-primary"
				icon={Wrench}
				size={26}
				x={325}
				y={75}
			/>
			<text className="fill-foreground" fontSize={30} x={361} y={99}>
				<tspan style={{ fontFamily: "var(--font-cal)" }}>
					{t("home.preview.title")}{" "}
				</tspan>
				<tspan fontWeight={500} style={{ fontFamily: "var(--font-inter)" }}>
					#{DEMO.orderNumber}
				</tspan>
			</text>
			<Text size={14} tone="muted" x={325} y={125}>
				{t("home.preview.description")}
			</Text>

			<line
				className="stroke-border"
				strokeDasharray="4 4"
				x1={965}
				x2={965}
				y1={153}
				y2={H}
			/>
			<rect
				className="fill-card stroke-border"
				height={14}
				rx={3}
				width={10}
				x={960}
				y={583}
			/>

			{/* Left column */}
			<Card
				description={t("serviceOrders.cards.deviceDescription")}
				h={186}
				icon={Wrench}
				index={0}
				title={t("serviceOrders.cards.deviceTitle")}
				w={LEFT.w}
				x={LEFT.x}
				y={153}
			>
				<Field
					label={t("serviceOrders.fields.receivedAt")}
					right={leftRight}
					value={DEMO.receivedAt}
					x={342}
					y={241}
				/>
				<Field
					label={t("serviceOrders.fields.imei")}
					right={leftRight}
					value={DEMO.imei}
					x={342}
					y={271}
				/>
				<Field
					label={t("serviceOrders.fields.description")}
					right={leftRight}
					x={342}
					y={301}
				/>
				<Text weight={500} x={342} y={323}>
					{t("home.preview.issue")}
				</Text>
			</Card>

			<Card
				description={t("serviceOrders.cards.lifecycleDescription")}
				h={508}
				icon={History}
				index={1}
				title={t("serviceOrders.cards.lifecycleTitle")}
				w={LEFT.w}
				x={LEFT.x}
				y={364}
			>
				<Step
					description={t("serviceOrders.lifecycle.recognitionDescription")}
					phase="finished"
					title={t("serviceOrders.lifecycle.recognitionTitle")}
					y={456}
				/>
				<line
					className="stroke-green-500"
					strokeWidth={2}
					x1={360}
					x2={360}
					y1={492}
					y2={596}
				/>
				<rect
					className="fill-background stroke-border"
					height={105}
					rx={8}
					width={532}
					x={390.5}
					y={490.5}
				/>
				<Entry
					at={DEMO.entryOneAt}
					text={t("home.preview.entryRegistered")}
					y={515}
				/>
				<Entry
					at={DEMO.entryTwoAt}
					text={t("home.preview.entryDiagnosis")}
					y={561}
				/>

				<Step
					description={t("serviceOrders.lifecycle.pendingDescription")}
					phase="inProgress"
					title={t("serviceOrders.lifecycle.pendingTitle")}
					y={637}
				/>
				<line
					className="stroke-primary"
					strokeWidth={2}
					x1={360}
					x2={360}
					y1={676}
					y2={704}
				/>
				<line
					className="stroke-border"
					strokeWidth={2}
					x1={360}
					x2={360}
					y1={704}
					y2={732}
				/>
				<rect
					className="fill-background stroke-border"
					height={59}
					rx={8}
					width={532}
					x={390.5}
					y={672.5}
				/>
				<Entry
					at={DEMO.entryThreeAt}
					live
					text={t("home.preview.entryWaiting")}
					y={697}
				/>

				<Step
					description={t("serviceOrders.lifecycle.progressDescription")}
					phase="pending"
					title={t("serviceOrders.lifecycle.progressTitle")}
					y={773}
				/>
				<Step
					description={t("serviceOrders.lifecycle.finishedDescription")}
					phase="pending"
					title={t("serviceOrders.lifecycle.finishedTitle")}
					y={837}
				/>
			</Card>

			<Card
				description={t("serviceOrders.items.description")}
				h={160}
				icon={Package}
				index={2}
				title={t("serviceOrders.items.title")}
				w={LEFT.w}
				x={LEFT.x}
				y={897}
			>
				<rect
					className="fill-card stroke-border"
					height={34}
					rx={6}
					width={581}
					x={342.5}
					y={972.5}
				/>
				<Text weight={500} x={355} y={994}>
					{t("home.preview.part")}
				</Text>
				<Text anchor="end" tone="muted" x={910} y={994}>
					{DEMO.quantity}
				</Text>
			</Card>

			{/* Right column */}
			<Card
				description={t("serviceOrders.cards.summaryDescription")}
				h={230}
				icon={ClipboardList}
				index={0}
				title={t("serviceOrders.cards.summaryTitle")}
				w={RIGHT.w}
				x={RIGHT.x}
				y={153}
			>
				<Field
					label={t("serviceOrders.fields.number")}
					right={rightRight}
					strong
					value={DEMO.orderNumber}
					x={1006}
					y={241}
				/>
				<Field
					label={t("serviceOrders.fields.status")}
					right={rightRight}
					x={1006}
					y={271}
				/>
				<rect
					className="fill-primary-200 dark:fill-primary-900"
					height={24}
					rx={10}
					width={131}
					x={1345}
					y={257}
				/>
				<Text
					anchor="middle"
					className="fill-primary-700 dark:fill-primary-200"
					tone="muted"
					weight={500}
					x={1410.5}
					y={274}
				>
					{t("serviceOrders.status.parts_pending")}
				</Text>
				<Field
					label={t("serviceOrders.fields.category")}
					right={rightRight}
					value={t("home.preview.category")}
					x={1006}
					y={307}
				/>
				<Field
					label={t("serviceOrders.fields.brand")}
					right={rightRight}
					value={DEMO.brand}
					x={1006}
					y={337}
				/>
				<Field
					label={t("serviceOrders.fields.model")}
					right={rightRight}
					value={DEMO.model}
					x={1006}
					y={367}
				/>
			</Card>

			<Card
				description={t("serviceOrders.cards.technicianDescription")}
				h={156}
				icon={User}
				index={1}
				title={t("serviceOrders.cards.technicianTitle")}
				w={RIGHT.w}
				x={RIGHT.x}
				y={408}
			>
				<Field
					label={t("serviceOrders.fields.assignee")}
					right={rightRight}
					value={DEMO.technician}
					x={1006}
					y={496}
				/>
				<Field
					label={t("serviceOrders.fields.notes")}
					right={rightRight}
					x={1006}
					y={526}
				/>
				<Text weight={500} x={1006} y={548}>
					{t("home.preview.notes")}
				</Text>
			</Card>

			<Card
				description={t("serviceOrders.cards.customerDescription")}
				h={164}
				icon={FileUser}
				index={2}
				title={t("serviceOrders.cards.customerTitle")}
				w={RIGHT.w}
				x={RIGHT.x}
				y={589}
			>
				<Field
					label={t("serviceOrders.fields.name")}
					right={rightRight}
					value={DEMO.client}
					x={1006}
					y={677}
				/>
				<Field
					label={t("serviceOrders.fields.document")}
					right={rightRight}
					value={DEMO.document}
					x={1006}
					y={707}
				/>
				<Field
					label={t("serviceOrders.fields.phone")}
					right={rightRight}
					value={DEMO.phone}
					x={1006}
					y={737}
				/>
			</Card>

			<Card
				description={t("serviceOrders.cards.imagesDescription")}
				h={280}
				icon={ImageIcon}
				index={3}
				title={t("serviceOrders.cards.imagesTitle")}
				w={RIGHT.w}
				x={RIGHT.x}
				y={778}
			>
				<clipPath id="mock-device-clip">
					<rect height={161} rx={8} width={228} x={1006} y={852} />
				</clipPath>
				<g clipPath="url(#mock-device-clip)">
					<rect
						className="fill-background"
						height={161}
						width={228}
						x={1006}
						y={852}
					/>
					<image
						height={128}
						href="/home_device.webp"
						preserveAspectRatio="xMidYMid slice"
						width={228}
						x={1006}
						y={852}
					/>
				</g>
				<rect
					className="fill-none stroke-border"
					height={161}
					rx={8}
					width={228}
					x={1006.5}
					y={852.5}
				/>
				<Text anchor="middle" size={12.5} tone="muted" x={1120} y={1002}>
					{t("home.preview.caption")}
				</Text>
			</Card>
		</IsoScene>
	);
}
