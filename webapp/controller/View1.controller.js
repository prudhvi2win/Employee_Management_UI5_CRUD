sap.ui.define([
    "sap/ui/core/mvc/Controller",
    "sap/ui/model/json/JSONModel",
    "sap/ui/core/Fragment",
    "sap/m/MessageToast",
    "sap/m/MessageBox"
], (Controller, JSONModel, Fragment, MessageToast, MessageBox) => {
    "use strict";

    return Controller.extend("com.emp.employee.controller.View1", {
        onInit: function () {
            // Initialize Master UI State Model
            var oViewModel = new JSONModel({ mode: "create" });
            this.getView().setModel(oViewModel, "viewModel");

            this.getOwnerComponent().getRouter().getRoute("RouteView1").attachPatternMatched(this._onRouteMatched, this);
            this._initBlankDraft();
        },

        _onRouteMatched: function (oEvent) {
            var sEmployeeID = oEvent.getParameter("arguments").id;

            if (!sEmployeeID || sEmployeeID === "new") {
                this._setMode("create");
                this._initBlankDraft();
            } else {
                this._sEmployeeID = sEmployeeID;
                this._setMode("view");
                this._loadDeepEmployeeData(sEmployeeID);
            }
        },

        // =========================================================================
        // READ: Eager Loading Deep Relationships
        // =========================================================================
        _loadDeepEmployeeData: function (sID) {
            var oView = this.getView();
            var oODataModel = this.getOwnerComponent().getModel();

            // oView.setBusy(true);

            // Execute GET with dual parameters to fetch both 1-to-1 and 1-to-many objects
            oODataModel.read("/Employees(guid'" + sID + "')", {
                urlParameters: {
                    "$expand": "addresses,passportDetail"
                },
                success: function (oData) {
                    oView.setBusy(false);
                    // Normalize standard OData arrays into clean JSON array states
                    if (oData.addresses && oData.addresses.results) {
                        oData.addresses = oData.addresses.results;
                    } else {
                        oData.addresses = [];
                    }

                    // Instantiate isolated sandbox draft with copies of live elements
                    var oDraftModel = new JSONModel(oData);
                    oView.setModel(oDraftModel, "draft");
                }.bind(this),
                error: function (oError) {
                    oView.setBusy(false);
                    MessageBox.error("Failed to load employee record.");
                }
            });
        },

        // =========================================================================
        // CREATE: Deep Insert Pattern
        // =========================================================================
        _executeDeepInsert: function (oPayload) {
            var oView = this.getView();
            var oODataModel = this.getOwnerComponent().getModel();

            // oView.setBusy(true);
            console.log("Before create");
            oODataModel.create("/Employees", oPayload, {
                success: function (oCreatedData) {
                    oView.setBusy(false);
                    MessageToast.show("Employee baseline and nested entities created successfully!");
                    this._sEmployeeID = oCreatedData.ID;
                    this._setMode("view");
                    this._loadDeepEmployeeData(oCreatedData.ID);
                }.bind(this),
                error: function (oError) {
                    oView.setBusy(false);
                    MessageBox.error("Deep Insert execution rejected.");
                }
            });
            console.log("After create");
        },

        // =========================================================================
        // UPDATE: Enterprise Transaction Batch Management
        // =========================================================================
        _executeBatchUpdate: function (oPayload) {
            var oODataModel = this.getOwnerComponent().getModel();
            var sEmployeePath = "/Employees(guid'" + oPayload.ID + "')";

            // Set default model mode to defer execution calls automatically
            oODataModel.setUseBatch(true);

            // 1. Queue Parent Properties Update via standard MERGE/PATCH
            var oParentUpdate = {
                name: oPayload.name,
                email: oPayload.email,
                department: oPayload.department,
                role: oPayload.role,
                salary: oPayload.salary
            };
            oODataModel.update(sEmployeePath, oParentUpdate);

            // 2. Queue Passport Properties Update
            if (oPayload.passportDetail) {
                var sPassportPath = "/PassportDetails(guid'" + oPayload.passportDetail.ID + "')";
                oODataModel.update(sPassportPath, {
                    passportNumber: oPayload.passportDetail.passportNumber,
                    expiryDate: oPayload.passportDetail.expiryDate,
                    nationality: oPayload.passportDetail.nationality
                });
            }

            // 3. Queue Child Modifications (Looping Address rows)
            oPayload.addresses.forEach(function (oAddress) {
                var sAddressPath = "/Addresses(guid'" + oAddress.ID + "')";
                oODataModel.update(sAddressPath, {
                    type: oAddress.type,
                    street: oAddress.street,
                    city: oAddress.city
                });
            });

            // 4. Submit entire stack inside a single atomic HTTP tunnel network transaction
            // this.getView().setBusy(true);
            oODataModel.submitChanges({
                success: function () {
                    this.getView().setBusy(false);
                    MessageToast.show("Changes saved securely via ChangeSet batch processing.");
                    this._setMode("view");
                }.bind(this),
                error: function () {
                    this.getView().setBusy(false);
                    MessageBox.error("Batch processing modification failed.");
                }.bind(this)
            });
        },

        // =========================================================================
        // EVENT HANDLERS: Local Dynamic Array Mutations
        // =========================================================================
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

        onSave: function () {
            var oDraftModel = this.getView().getModel("draft");
            if (!oDraftModel) {
                MessageBox.error("No draft data available to save.");
                return;
            }
            console.log("Mode:", this._getMode());
            var oPayload = oDraftModel.getData();

            if (this._getMode() === "create") {
                this._executeDeepInsert(oPayload);
            } else {
                this._executeBatchUpdate(oPayload);
            }
        },

        // =========================================================================
        // ADDED LUI HANDLING ACTIONS
        // =========================================================================
        onEdit: function () {
            this._setMode("edit");
        },

        onCancel: function () {
            var sMode = this._getMode();
            if (sMode === "create") {
                // Reset to a blank form instead of navigating away,
                // since create and the employee list share this same view
                this._initBlankDraft();
            } else {
                this._setMode("view");
                // Re-read live server data to overwrite sandbox mutations safely
                var oDraftData = this.getView().getModel("draft").getData();
                this._loadDeepEmployeeData(oDraftData.ID);
            }
        },

        onDeleteAddressRow: function (oEvent) {
            var oItem = oEvent.getSource().getParent();
            var oDraftModel = this.getView().getModel("draft");
            var aAddresses = oDraftModel.getProperty("/addresses");

            // Get path context index of the row clicked
            var sPath = oItem.getBindingContextPath();
            var iIndex = parseInt(sPath.substring(sPath.lastIndexOf("/") + 1), 10);

            // Mutate data array locally 
            aAddresses.splice(iIndex, 1);
            oDraftModel.setProperty("/addresses", aAddresses);
        },

        onDelete: function () {
            var oODataModel = this.getOwnerComponent().getModel();
            var sID = this._sEmployeeID;

            MessageBox.confirm("Delete this employee record? This cannot be undone.", {
                onClose: function (sAction) {
                    if (sAction === MessageBox.Action.OK) {
                        oODataModel.remove("/Employees(guid'" + sID + "')", {
                            success: function () {
                                MessageToast.show("Employee deleted.");
                                this.getOwnerComponent().getRouter().navTo("TargetMainView", {}, true);
                            }.bind(this),
                            error: function () {
                                MessageBox.error("Delete failed.");
                            }
                        });
                    }
                }.bind(this)
            });
        },

        onEmployeeRowPress: function (oEvent) {
            var oItem = oEvent.getParameter("listItem");
            var sID = oItem.getBindingContext().getProperty("ID");

            this._sEmployeeID = sID;
            this._setMode("view");
            this._loadDeepEmployeeData(sID);
        },

        onNewEmployee: function () {
            this._sEmployeeID = null;
            this._setMode("create");
            this._initBlankDraft();
        },

        // =========================================================================
        // CORE HELPERS
        // =========================================================================
        _initBlankDraft: function () {
            var oBlankData = {
                name: "", 
                email: "", 
                department: "Engineering", 
                role: "", 
                salary: "0.00",
                passportDetail: { passportNumber: "", 
                                  expiryDate: "", 
                                  nationality: "" 
                                },
                addresses: []
            };
            this.getView().setModel(new JSONModel(oBlankData), "draft");
        },

        _setMode: function (sMode) { this.getView().getModel("viewModel").setProperty("/mode", sMode); },
        _getMode: function () { return this.getView().getModel("viewModel").getProperty("/mode"); }
    });
});