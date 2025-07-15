/* Modified by coolssor */

import St from 'gi://St'; // Import the St library for creating UI elements.
import Gio from 'gi://Gio'; // Import the Gio library for accessing settings.

import * as Main from 'resource:///org/gnome/shell/ui/main.js'; // Import the main GNOME Shell UI module.
import * as Layout from 'resource:///org/gnome/shell/ui/layout.js'; // Import the layout module for managing UI layout.

import * as MMPanel from './mmpanel.js'; // Import the custom Multi-monitor panel module.
import { g } from './globals.js'; // Import global variables.
var { mmPanel } = g; // Extract the `mmPanel` array from global variables.

var ENABLE_HOT_CORNERS = 'enable-hot-corners'; // Define the key for enabling/disabling hot corners.

export const MultiMonitorPanelBox = class MultiMonitorPanelBox {
	constructor(monitor) {
		// Create a new panel box for a specific monitor.
		this.panelBox = new St.BoxLayout({ name: 'panelBox', vertical: true, clip_to_allocation: true });
		// Add the panel box to the layout manager with specific properties.
		Main.layoutManager.addChrome(this.panelBox, { affectsStruts: true, trackFullscreen: true });
		// Set the position and size of the panel box based on the monitor's dimensions.
		this.panelBox.set_position(monitor.x, monitor.y);
		this.panelBox.set_size(monitor.width, -1);
		// Place the panel box below the main panel box in the UI hierarchy.
		Main.uiGroup.set_child_below_sibling(this.panelBox, Main.layoutManager.panelBox);
	}

	destroy() {
		// Destroy the panel box when it is no longer needed.
		this.panelBox.destroy();
	}

	updatePanel(monitor) {
		// Update the position and size of the panel box when the monitor's dimensions change.
		this.panelBox.set_position(monitor.x, monitor.y);
		this.panelBox.set_size(monitor.width, -1);
	}
};

export var MultiMonitorLayoutManager = class MultiMonitorLayoutManager {
	constructor(settings) {
		// Initialize the layout manager with settings.
		this._settings = settings;
		this._desktopSettings = new Gio.Settings({schema_id: 'org.gnome.desktop.interface'});

		mmPanel = []; // Initialize the array to store panel instances.

		this._monitorIds = []; // Array to track monitor IDs.
		this.mmPanelBox = []; // Array to store panel box instances.

		this._monitorsChangedId = null; // ID for the 'monitors-changed' signal connection.

		this._layoutManager_updateHotCorners = null; // Backup for the original `_updateHotCorners` method.
		this._changedEnableHotCornersId = null; // ID for the 'changed::enable-hot-corners' signal connection.
	}

	showPanel() {
		// Show the panel and set up necessary connections and overrides.

		if (!this._monitorsChangedId) {
			// Connect to the 'monitors-changed' signal to handle monitor changes.
			this._monitorsChangedId = Main.layoutManager.connect('monitors-changed', this._monitorsChanged.bind(this));
			this._monitorsChanged(); // Trigger the initial monitor change handling.
		}

		if (!this._layoutManager_updateHotCorners) {
			// Backup the original `_updateHotCorners` method and override it.
			this._layoutManager_updateHotCorners = Main.layoutManager._updateHotCorners;

			const _this = this; // Preserve the context for use inside the overridden method.
			Main.layoutManager._updateHotCorners = function () {
				// Destroy existing hot corners.
				this.hotCorners.forEach((corner) => {
					if (corner)
						corner.destroy();
				});
				this.hotCorners = [];

				// Check if hot corners are disabled in the settings.
				if (!_this._desktopSettings.get_boolean(ENABLE_HOT_CORNERS)) {
					this.emit('hot-corners-changed');
					return;
				}

				// Create new hot corners for each monitor.
				let size = this.panelBox.height;

				for (let i = 0; i < this.monitors.length; i++) {
					let monitor = this.monitors[i];
					let cornerX = this._rtl ? monitor.x + monitor.width : monitor.x;
					let cornerY = monitor.y;

					let corner = new Layout.HotCorner(this, monitor, cornerX, cornerY);
					corner.setBarrierSize(size);
					this.hotCorners.push(corner);
				}

				this.emit('hot-corners-changed');
			};

			if (!this._changedEnableHotCornersId) {
				// Connect to the 'changed::enable-hot-corners' signal to update hot corners when the setting changes.
				this._changedEnableHotCornersId = this._desktopSettings.connect('changed::' + ENABLE_HOT_CORNERS,
					Main.layoutManager._updateHotCorners.bind(Main.layoutManager));
			}

			// Trigger the updated `_updateHotCorners` method.
			Main.layoutManager._updateHotCorners();
		}
	}

	hidePanel() {
		// Hide the panel and clean up connections and overrides.

		if (this._changedEnableHotCornersId) {
			// Disconnect the 'changed::enable-hot-corners' signal.
			this._desktopSettings.disconnect(this._changedEnableHotCornersId);
			this._changedEnableHotCornersId = null;
		}

		if (this._layoutManager_updateHotCorners) {
			// Restore the original `_updateHotCorners` method.
			Main.layoutManager['_updateHotCorners'] = this._layoutManager_updateHotCorners;
			this._layoutManager_updateHotCorners = null;
			Main.layoutManager._updateHotCorners();
		}

		if (this._monitorsChangedId) {
			// Disconnect the 'monitors-changed' signal.
			Main.layoutManager.disconnect(this._monitorsChangedId);
			this._monitorsChangedId = null;
		}

		// Remove all panels.
		let panels2remove = this._monitorIds.length;
		for (let i = 0; i < panels2remove; i++) {
			let monitorId = this._monitorIds.pop();
			this._popPanel();
			console.log("remove: " + monitorId);
		}
	}

	_monitorsChanged() {
		// Handle changes in the number or configuration of monitors.

		let monitorChange = Main.layoutManager.monitors.length - this._monitorIds.length - 1;
		if (monitorChange < 0) {
			// Remove panels for monitors that are no longer present.
			for (let idx = 0; idx < -monitorChange; idx++) {
				let monitorId = this._monitorIds.pop();
				this._popPanel();
				console.log("remove: " + monitorId);
			}
		}

		let j = 0;
		for (let i = 0; i < Main.layoutManager.monitors.length; i++) {
			if (i != Main.layoutManager.primaryIndex) {
				// Skip the primary monitor.
				let monitor = Main.layoutManager.monitors[i];
				let monitorId = "i" + i + "x" + monitor.x + "y" + monitor.y + "w" + monitor.width + "h" + monitor.height;
				if (monitorChange > 0 && j == this._monitorIds.length) {
					// Add a new panel for a new monitor.
					this._monitorIds.push(monitorId);
					this._pushPanel(i, monitor);
					console.log("new: " + monitorId);
				}
				else if (this._monitorIds[j] > monitorId || this._monitorIds[j] < monitorId) {
					// Update an existing panel if the monitor configuration has changed.
					let oldMonitorId = this._monitorIds[j];
					this._monitorIds[j] = monitorId;
					this.mmPanelBox[j].updatePanel(monitor);
					console.log("update: " + oldMonitorId + ">" + monitorId);
				}
				j++;
			}
		}
	}

	_pushPanel(i, monitor) {
		// Create and add a new panel for a monitor.
		let mmPanelBox = new MultiMonitorPanelBox(monitor);
		let panel = new MMPanel.MultiMonitorPanel(i, mmPanelBox);

		mmPanel.push(panel); // Add the panel to the global array.
		this.mmPanelBox.push(mmPanelBox); // Add the panel box to the local array.
	}

	_popPanel() {
		// Remove the last panel and its associated panel box.
		mmPanel.pop();
		let mmPanelBox = this.mmPanelBox.pop();
		mmPanelBox.destroy();
	}
};
