<?php

declare(strict_types=1);

namespace OCA\ClassicAppMenu\Controller;

use OCA\ClassicAppMenu\Service\ConfigService;
use OCP\AppFramework\Controller;
use OCP\AppFramework\Http\Attribute\FrontpageRoute;
use OCP\AppFramework\Http\JSONResponse;
use OCP\IRequest;

/**
 * Admin only: no NoAdminRequired attribute on purpose.
 */
class SettingsController extends Controller {
	public function __construct(
		string $appName,
		IRequest $request,
		private ConfigService $configService,
	) {
		parent::__construct($appName, $request);
	}

	#[FrontpageRoute(verb: 'PUT', url: '/settings')]
	public function save(
		array $top = [],
		array $waffle = [],
		string $unassigned = 'top',
		string $wafflePosition = 'end',
		bool $waffleShowsAll = false,
	): JSONResponse {
		return new JSONResponse($this->configService->set([
			'top' => $top,
			'waffle' => $waffle,
			'unassigned' => $unassigned,
			'wafflePosition' => $wafflePosition,
			'waffleShowsAll' => $waffleShowsAll,
		]));
	}

	#[FrontpageRoute(verb: 'DELETE', url: '/settings')]
	public function reset(): JSONResponse {
		return new JSONResponse($this->configService->reset());
	}
}
