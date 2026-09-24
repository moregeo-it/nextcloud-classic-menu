<?php
/**
 * SPDX-License-Identifier: AGPL-3.0-or-later
 *
 * @var \OCP\IL10N $l
 */
?>
<div id="classic-appmenu-settings" class="section">
	<h2><?php p($l->t('Header app icons')); ?></h2>
	<p class="settings-hint">
		<?php p($l->t('Choose which apps are shown as icons in the header and which ones go into the waffle menu. Drag the apps between the lists or use the buttons. The order applies to all users and overrides their personal app order.')); ?>
	</p>

	<div class="classic-appmenu-settings__columns">
		<div class="classic-appmenu-settings__column">
			<h3 id="classic-appmenu-top-heading"><?php p($l->t('Top bar')); ?></h3>
			<ol class="classic-appmenu-settings__list" data-target="top" aria-labelledby="classic-appmenu-top-heading"></ol>
		</div>
		<div class="classic-appmenu-settings__column">
			<h3 id="classic-appmenu-waffle-heading"><?php p($l->t('Waffle menu')); ?></h3>
			<ol class="classic-appmenu-settings__list" data-target="waffle" aria-labelledby="classic-appmenu-waffle-heading"></ol>
		</div>
	</div>
	<p class="settings-hint">
		<?php p($l->t('Top bar icons that do not fit on narrow screens are moved into the waffle menu. The waffle menu is hidden when it has no entries.')); ?>
	</p>

	<!-- Native inputs on purpose: core's legacy .radio/.checkbox classes move the input
		10000px off-screen, and focusing it makes the settings content scroll away. -->
	<fieldset class="classic-appmenu-settings__option">
		<legend><?php p($l->t('Apps not listed above (newly installed apps and apps you do not have access to) are shown in the')); ?></legend>
		<label class="classic-appmenu-settings__choice">
			<input type="radio" name="classic-appmenu-unassigned" value="top">
			<?php p($l->t('Top bar')); ?>
		</label>
		<label class="classic-appmenu-settings__choice">
			<input type="radio" name="classic-appmenu-unassigned" value="waffle">
			<?php p($l->t('Waffle menu')); ?>
		</label>
	</fieldset>

	<fieldset class="classic-appmenu-settings__option">
		<legend><?php p($l->t('Position of the waffle menu')); ?></legend>
		<label class="classic-appmenu-settings__choice">
			<input type="radio" name="classic-appmenu-position" value="start">
			<?php p($l->t('Before the icons')); ?>
		</label>
		<label class="classic-appmenu-settings__choice">
			<input type="radio" name="classic-appmenu-position" value="end">
			<?php p($l->t('After the icons')); ?>
		</label>
	</fieldset>

	<p class="classic-appmenu-settings__option">
		<label class="classic-appmenu-settings__choice">
			<input type="checkbox" id="classic-appmenu-shows-all">
			<?php p($l->t('Also list the top bar apps in the waffle menu')); ?>
		</label>
	</p>

	<p class="classic-appmenu-settings__actions">
		<button type="button" class="button primary" id="classic-appmenu-save"><?php p($l->t('Save')); ?></button>
		<button type="button" class="button" id="classic-appmenu-reset"><?php p($l->t('Reset to default')); ?></button>
		<span class="classic-appmenu-settings__status" id="classic-appmenu-status" role="status" aria-live="polite"></span>
	</p>
</div>
