sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/m/MessageToast",
    "sap/m/MessageBox",
    "sap/ui/core/Fragment"
], function (Controller, JSONModel, MessageToast, MessageBox, Fragment) {
    "use strict";

    return Controller.extend("com.emp.employee.controller.EmployeeDetail", {
        onInit: function () {
            var oViewModel = new JSONModel({ mode: "view" });
            this.getView().setModel(oViewModel, "viewModel");

            this.getOwnerComponent().getRouter().getRoute("EmployeeDetail").attachPatternMatched(this._onRouteMatched, this);
        },

        _onRouteMatched: function (oEvent) {
            var sEmployeeID = oEvent.getParameter("arguments").id;

            if (sEmployeeID === "new") {
                this._setMode("create");
                this._initBlankDraft();
            } else {
                this._setMode("view");
                this._loadDeepEmployeeData(sEmployeeID);
            }
        },

        _loadDeepEmployeeData: function (sID) {
            var oView = this.getView();
            oView.setBusy(true);

            var oModel = this.getOwnerComponent().getModel();
            var sPath = "/Employees(" + sID + ")";

            oModel.read(sPath, {
                urlParameters: {
                    "$expand": "addresses,passportDetail"
                },
                success: function (oData) {
                    oView.setBusy(false);
                    if (oData.addresses && oData.addresses.results) {
                        oData.addresses = oData.addresses.results;
                    } else {
                        oData.addresses = [];
                    }
                    oView.setModel(new JSONModel(oData), "draft");
                },
                error: function (oError) {
                    oView.setBusy(false);
                    MessageBox.error("Failed to load details: " + oError.message);
                }
            });
        },

        onSave: function () {
            var oPayload = this.getView().getModel("draft").getData();
            var oModel = this.getOwnerComponent().getModel();
            var oView = this.getView();

            oView.setBusy(true);

            if (this._getMode() === "create") {
                oModel.create("/Employees", oPayload, {
                    success: function () {
                        oView.setBusy(false);
                        MessageBox.success("Employee created successfully!", {
                            onClose: this.onNavBack.bind(this)
                        });
                    }.bind(this),
                    error: function (oError) {
                        oView.setBusy(false);
                        MessageBox.error("Creation failed: " + oError.message);
                    }
                });
            } else {
                var sPath = "/Employees(" + oPayload.ID + ")";
                oModel.update(sPath, oPayload, {
                    success: function () {
                        oView.setBusy(false);
                        MessageBox.show("Changes saved successfully!");
                        this._setMode("view");
                    }.bind(this),
                    error: function (oError) {
                        oView.setBusy(false);
                        MessageBox.error("Save failed: " + oError.message);
                    }
                });
            }
        },

        onDelete: function () {
            var oPayload = this.getView().getModel("draft").getData();
            var oModel = this.getOwnerComponent().getModel();
            var oView = this.getView();

            MessageBox.confirm("Are you sure you want to delete this record?", {
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        oView.setBusy(true);
                        var sPath = "/Employees(" + oPayload.ID + ")";
                        oModel.remove(sPath, {
                            success: function () {
                                oView.setBusy(false);
                                MessageToast.show("Record deleted.");
                                this.onNavBack();
                            }.bind(this),
                            error: function (oError) {
                                oView.setBusy(false);
                                MessageBox.error("Delete failed: " + oError.message);
                            }
                        });
                    }
                }.bind(this)
            });
        },

        onAddAddressRow: function () {
            var oDraftModel = this.getView().getModel("draft");
            if (!oDraftModel) {
                this._initBlankDraft();
                oDraftModel = this.getView().getModel("draft");
            }

            var aAddresses = oDraftModel.getProperty("/addresses") || [];

            // Push completely empty array structural payload blueprint
            aAddresses.push({
                type: "HOME",
                street: "",
                city: "",
                postalCode: "",
                country: ""
            });

            oDraftModel.setProperty("/addresses", aAddresses);
        },

        onEdit: function () {
            this._setMode("edit");
        },
        onCancel: function () {
            this.onNavBack();
        },
        onNavBack: function () {
            this.getOwnerComponent().getRouter().navTo("EmployeeList", {}, true);
        },
        _initBlankDraft: function () {
            this.getView().setModel(new JSONModel({
                name: "", email: "", department: "Engineering", role: "", salary: 0,
                passportDetail: { passportNumber: "", nationality: "" },
                addresses: []
            }), "draft");
        },
        _setMode: function (sMode) { this.getView().getModel("viewModel").setProperty("/mode", sMode); },
        _getMode: function () { return this.getView().getModel("viewModel").getProperty("/mode"); },

        onCountryVH: function (oEvent) {
            this._openCountryDialog(oEvent.getSource());
        },

        onNationalityValueHelp: function (oEvent) {
            this._openCountryDialog(oEvent.getSource());
        },

        _openCountryDialog: function (oSourceControl) {
            this._oValueHelpInput = oSourceControl;

            if (this._oCountrySelectDialog) {
                this._oCountrySelectDialog.open();
                return;
            }

            Fragment.load({
                id: this.getView().getId(),
                name: "com.emp.employee.view.fragments.CountryF4Help",
                controller: this
            }).then(function (oDialog) {
                this._oCountrySelectDialog = oDialog;
                this.getView().addDependent(oDialog);
                oDialog.open();
            }.bind(this));
        },

        onCountryF4Close: function () {
            if (this._oCountrySelectDialog) {
                this._oCountrySelectDialog.close();
            }
        },

        onCountrySelect: function (oEvent) {
            var sCountry = oEvent.getSource().getBindingContext().getProperty("name");

            if (this._oValueHelpInput) {
                this._oValueHelpInput.setValue(sCountry);
            }

            this._oCountrySelectDialog.close();
        },

        onPromoteEmployee: function () {
            var oDraftModel = this.getView().getModel("draft");
            if (!oDraftModel) {
                MessageBox.error("No employee data available for promotion.");
                return;
            }

            var oPayload = oDraftModel.getData();
            if (!oPayload.ID) {
                MessageBox.error("Please save the employee before promoting.");
                return;
            }

            var sNewRole = oPayload.role ? oPayload.role + " Senior" : "Senior";
            var nSalaryIncrement = 9999.00;
            var oModel = this.getOwnerComponent().getModel();
            var oView = this.getView();

            oView.setBusy(true);

            oModel.callFunction("/EmployeeService/promoteEmployee", {
                method: "POST",
                urlParameters: {
                    employeeId: oPayload.ID,
                    newRole: sNewRole,
                    salaryIncrement: nSalaryIncrement
                },
                success: function (oData) {
                    oView.setBusy(false);
                    if (oData) {
                        oDraftModel.setData(oData);
                    }
                    MessageToast.show("Employee promoted to " + sNewRole + ".");
                    this._setMode("view");
                }.bind(this),
                error: function (oError) {
                    oView.setBusy(false);
                    MessageBox.error("Promotion failed: " + oError.message);
                }
            });
        }
    });
});