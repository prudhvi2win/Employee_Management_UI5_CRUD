sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("com.emp.employee.controller.Master", {
        onNavigationSelect: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            var sTitle = oItem.getTitle();
            var oRouter = this.getOwnerComponent().getRouter();

            // Direct route traffic based on what item is picked
            if (sTitle === "Manage Employees") {
                oRouter.navTo("EmployeeList");
            } else if (sTitle === "Leave Requests") {
                oRouter.navTo("LeaveRequests");
            } else if (sTitle === "Upload Resumes") {
                oRouter.navTo("UploadResumes");
            }
        }
    });
});