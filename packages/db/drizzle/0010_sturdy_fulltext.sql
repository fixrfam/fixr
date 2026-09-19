ALTER TABLE `models` ADD FULLTEXT INDEX `models_fulltext_idx` (`name`, `models_text`, `chipset`, `cpu`, `internal_memory`, `os`);
