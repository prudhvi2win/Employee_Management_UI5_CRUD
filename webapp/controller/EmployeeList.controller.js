sap.ui.define([
    "sap/ui/core/mvc/Controller"
], function (Controller) {
    "use strict";

    return Controller.extend("com.emp.employee.controller.EmployeeList", {
        onEmployeeRowPress: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            // In OData v4, we get the bound path (e.g., /Employees(ID=12345))
            var sPath = oItem.getBindingContext().getPath();
            // Extract just the ID/Key part within the parentheses
            var sEmployeeID = sPath.substring(sPath.indexOf("(") + 1, sPath.indexOf(")"));
            
            this.getOwnerComponent().getRouter().navTo("EmployeeDetail", {
                id: sEmployeeID
            });
        },

        onNewEmployee: function () {
            this.getOwnerComponent().getRouter().navTo("EmployeeDetail", {
                id: "new"
            });
        }
    });
});