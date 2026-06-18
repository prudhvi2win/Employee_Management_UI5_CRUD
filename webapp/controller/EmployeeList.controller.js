sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/Filter",
    "sap/ui/model/FilterOperator",
    "sap/ui/comp/valuehelpdialog/ValueHelpDialog"

], function (Controller, Filter, FilterOperator, ValueHelpDialog) {
    "use strict";

    return Controller.extend("com.emp.employee.controller.EmployeeList", {
        onInit: function () {

        },
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
        },

        // Triggered automatically when clicking "Go" on the SmartFilterBar
        onSearch: function () {
            var oSmartFilter = this.byId("smartFilterBar");
            var oTable = this.byId("employeeTable");
            
            if (!oTable) {
                return;
            }
            
            var oBinding = oTable.getBinding("items");
            
            if (!oBinding) {
                return;
            }

            // SmartFilterBar compiles all complex operators (EQ, BT, GT, etc.) into UI5 filter instances automatically
            var aFilters = oSmartFilter.getFilters();

            // Apply directly to your UI list binding
            oBinding.filter(aFilters);
        }
    });
});