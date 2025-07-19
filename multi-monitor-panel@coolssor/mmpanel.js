/*
Copyright (C) 2014  spin83

This program is free software; you can redistribute it and/or
modify it under the terms of the GNU General Public License
as published by the Free Software Foundation; either version 2
of the License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
GNU General Public License for more details.

You should have received a copy of the GNU General Public License
along with this program; if not, visit https://www.gnu.org/licenses/.
*/

/* Modified by coolssor */

import GObject from 'gi://GObject'; // Import GObject for creating GObject-based classes.

import * as Main from 'resource:///org/gnome/shell/ui/main.js'; // Import Main module for accessing GNOME Shell's main components.
import * as Panel from 'resource:///org/gnome/shell/ui/panel.js'; // Import Panel module for extending GNOME Shell's panel functionality.

/**
 * Helper function to retrieve all app indicators from the main panel.
 * @returns {Object} A dictionary of app indicators where the key is the indicator name and the value is the indicator object.
 */
function getMainIndicators() {
	let ret = {}; // Initialize an empty object to store the indicators.
	Object.entries(Main.panel.statusArea) // Iterate over all entries in the main panel's status area.
		.forEach(([key, value]) => {
			// Check if the key starts with "appindicator-" and the value's constructor name matches specific indicator types.
			if (key.startsWith("appindicator-") && ["IndicatorStatusTrayIcon", "IndicatorStatusIcon"].includes(value.constructor.name)) {
				ret[key] = value; // Add the indicator to the result object.
			}
		});
	return ret; // Return the collected indicators.
}

/**
 * MultiMonitorPanel class extends the GNOME Shell's Panel class to support multiple monitors.
 */
export const MultiMonitorPanel = GObject.registerClass(
	class MultiMonitorPanel extends Panel.Panel {
		/**
		 * Constructor for initializing the MultiMonitorPanel.
		 * @param {number} monitorIndex - The index of the monitor this panel belongs to.
		 * @param {Object} mmPanelBox - The container for the multi-monitor panel.
		 */
		constructor(monitorIndex, mmPanelBox) {
			super(); // Call the parent class's constructor.
			Main.layoutManager.panelBox.remove_child(this); // Remove the panel from the default panel box.
			mmPanelBox.panelBox.add_child(this); // Add the panel to the custom multi-monitor panel box.
			this.monitorIndex = monitorIndex; // Store the monitor index.
			this.connect('destroy', this._onDestroy.bind(this)); // Connect the destroy signal to the _onDestroy method.
		}

		/**
		 * Synchronize app indicators from the main panel to this panel.
		 */
		_syncIndicators() {
			// Iterate over all app indicators retrieved from the main panel.
			Object.entries(getMainIndicators()).forEach(([key, value]) => {
				try {
					// Attempt to add the indicator to this panel's status area.
					this.addToStatusArea(key, value, 1);
				} catch {
					// Log a warning if adding the indicator fails.
					console.warn("Skipping role: " + key);
				}
			});
		}

		/**
		 * Cleanup logic when the panel is destroyed.
		 */
		_onDestroy() {
			// Remove this panel from the Ctrl+Alt+Tab manager.
			Main.ctrlAltTabManager.removeGroup(this);
		}

		/**
		 * Override the method to provide the preferred width of the panel.
		 * @returns {Array} An array containing the minimum and maximum width of the panel.
		 */
		vfunc_get_preferred_width() {
			// Check if the monitor index is valid and return the width of the corresponding monitor.
			if (Main.layoutManager.monitors.length > this.monitorIndex)
				return [0, Main.layoutManager.monitors[this.monitorIndex].width];

			// Return zero width if the monitor index is invalid.
			return [0, 0];
		}
	}
);
