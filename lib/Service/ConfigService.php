<?php

declare(strict_types=1);

namespace OCA\ClassicAppMenu\Service;

use OCA\ClassicAppMenu\AppInfo\Application;
use OCP\IAppConfig;

/**
 * Stores the global header layout as a single JSON app config value.
 *
 * - top:            ordered navigation entry ids shown in the top bar
 * - waffle:         ordered navigation entry ids shown in the waffle menu
 * - unassigned:     where entries go that are in neither list ('top' or 'waffle')
 * - wafflePosition: whether the waffle button sits before ('start') or after ('end') the icons
 * - waffleShowsAll: also list the top bar apps in the waffle menu
 */
class ConfigService {
	private const KEY = 'layout';

	public const DEFAULTS = [
		'top' => [],
		'waffle' => [],
		'unassigned' => 'top',
		'wafflePosition' => 'end',
		'waffleShowsAll' => false,
	];

	public function __construct(
		private IAppConfig $appConfig,
	) {
	}

	public function get(): array {
		$raw = $this->appConfig->getValueString(Application::APP_ID, self::KEY, '');
		if ($raw === '') {
			return self::DEFAULTS;
		}
		try {
			$data = json_decode($raw, true, 8, JSON_THROW_ON_ERROR);
		} catch (\JsonException) {
			return self::DEFAULTS;
		}
		return $this->sanitize(is_array($data) ? $data : []);
	}

	public function set(array $data): array {
		$config = $this->sanitize($data);
		$this->appConfig->setValueString(Application::APP_ID, self::KEY, json_encode($config, JSON_THROW_ON_ERROR));
		return $config;
	}

	public function reset(): array {
		$this->appConfig->deleteKey(Application::APP_ID, self::KEY);
		return self::DEFAULTS;
	}

	public function sanitize(array $data): array {
		$top = $this->sanitizeIds($data['top'] ?? []);
		// An entry can only live in one list, the top bar wins
		$waffle = array_values(array_diff($this->sanitizeIds($data['waffle'] ?? []), $top));

		return [
			'top' => $top,
			'waffle' => $waffle,
			'unassigned' => ($data['unassigned'] ?? '') === 'waffle' ? 'waffle' : 'top',
			'wafflePosition' => ($data['wafflePosition'] ?? '') === 'start' ? 'start' : 'end',
			'waffleShowsAll' => (bool)($data['waffleShowsAll'] ?? false),
		];
	}

	/**
	 * @return list<string>
	 */
	private function sanitizeIds(mixed $ids): array {
		if (!is_array($ids)) {
			return [];
		}
		$result = [];
		foreach ($ids as $id) {
			if (is_string($id) && preg_match('/^[a-zA-Z0-9_.\-]{1,64}$/', $id) === 1 && !in_array($id, $result, true)) {
				$result[] = $id;
			}
		}
		return $result;
	}
}
