/* global QUnit */
QUnit.config.autostart = false;

sap.ui.require(["com/emp/employee/test/integration/AllJourneys"
], function () {
	QUnit.start();
});
