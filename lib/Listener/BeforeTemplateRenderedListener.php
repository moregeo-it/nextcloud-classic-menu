<?php

declare(strict_types=1);

namespace OCA\ClassicAppMenu\Listener;

use OCA\ClassicAppMenu\AppInfo\Application;
use OCA\ClassicAppMenu\Service\ConfigService;
use OCP\AppFramework\Http\Events\BeforeTemplateRenderedEvent;
use OCP\AppFramework\Http\TemplateResponse;
use OCP\AppFramework\Services\IInitialState;
use OCP\EventDispatcher\Event;
use OCP\EventDispatcher\IEventListener;
use OCP\Util;

/**
 * @template-implements IEventListener<BeforeTemplateRenderedEvent>
 */
class BeforeTemplateRenderedListener implements IEventListener {
	public function __construct(
		private ConfigService $configService,
		private IInitialState $initialState,
	) {
	}

	public function handle(Event $event): void {
		if (!($event instanceof BeforeTemplateRenderedEvent)) {
			return;
		}
		// Only the user layout has the app menu in the header
		if (!$event->isLoggedIn() || $event->getResponse()->getRenderAs() !== TemplateResponse::RENDER_AS_USER) {
			return;
		}

		$this->initialState->provideInitialState('config', $this->configService->get());
		Util::addStyle(Application::APP_ID, 'main');
		Util::addScript(Application::APP_ID, 'main');
	}
}
