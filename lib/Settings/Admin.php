<?php

declare(strict_types=1);

namespace OCA\ClassicAppMenu\Settings;

use OCA\ClassicAppMenu\AppInfo\Application;
use OCA\ClassicAppMenu\Service\ConfigService;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Services\IInitialState;
use OCP\INavigationManager;
use OCP\Settings\ISettings;
use OCP\Util;

class Admin implements ISettings {
	public function __construct(
		private ConfigService $configService,
		private IInitialState $initialState,
		private INavigationManager $navigationManager,
	) {
	}

	public function getForm(): TemplateResponse {
		// Only entries visible to the current admin can be listed by name,
		// entries of apps restricted to other groups follow the "unassigned" rule.
		$entries = array_map(static fn (array $entry): array => [
			'id' => (string)$entry['id'],
			'name' => (string)($entry['name'] ?? $entry['id']),
			'icon' => (string)($entry['icon'] ?? ''),
		], array_values($this->navigationManager->getAll(INavigationManager::TYPE_APPS)));

		$this->initialState->provideInitialState('config', $this->configService->get());
		$this->initialState->provideInitialState('defaults', ConfigService::DEFAULTS);
		$this->initialState->provideInitialState('entries', $entries);

		Util::addStyle(Application::APP_ID, 'admin');
		Util::addScript(Application::APP_ID, 'admin');

		return new TemplateResponse(Application::APP_ID, 'admin', [], '');
	}

	public function getSection(): string {
		return 'theming';
	}

	public function getPriority(): int {
		return 90;
	}
}
