sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel",
    "../model/formatter",
    "sap/m/library",
    "sap/ui/model/Filter"
], function (BaseController, JSONModel, formatter, mobileLibrary, Filter) {
    "use strict";

    // shortcut for sap.m.URLHelper
    var URLHelper = mobileLibrary.URLHelper;

    return BaseController.extend("fr.stms.testodatav4.controller.Detail", {

        formatter: formatter,

        /* =========================================================== */
        /* lifecycle methods                                           */
        /* =========================================================== */

        onInit: function () {
            var oViewModel = new JSONModel({
                lineItemListTitle : this.getResourceBundle().getText("detailLineItemTableHeading")
            });

            this.oMessageManager = sap.ui.getCore().getMessageManager();

            this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);
            this.setModel(oViewModel, "detailView");              
            this.setModel(this.getOwnerComponent().getModel(), "SelectedPerson"); //Used for the selected person context 

        },

        /* =========================================================== */
        /* event handlers                                              */
        /* =========================================================== */

        
        /**
         * Updates the item count within the line item table's header
         * @param {object} oEvent an event containing the total number of items in the list
         * @private
         */
        onListUpdateFinished: function (oEvent) {
            var sTitle,
                iTotalItems = oEvent.getParameter("total"),
                oViewModel = this.getModel("detailView");

            // only update the counter if the length is final
            if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
                if (iTotalItems) {
                    sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
                } else {
                    //Display 'Line Items' instead of 'Line items (0)'
                    sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
                }
                oViewModel.setProperty("/lineItemListTitle", sTitle);
            }
        },

        /**
         * Binds the view to the object path and expands the aggregated line items.
         * @function
         * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
         * @private
         */
        _onObjectMatched: function (oEvent) {            
            var sTeamId =  oEvent.getParameter("arguments").teamId;
            this.getModel("appView").setProperty("/layout", "TwoColumnsMidExpanded");                 
                               
            //this.getView().bindElement({ path : `/TeamSet(${sTeamId})` });                          
            let oContextKeepAlive = this.getView().getModel().getKeepAliveContext(`/TeamSet(${sTeamId})`);
            this.getView().setBindingContext(oContextKeepAlive); //Récupérer le context "draft" existant sur l'objet            

            this.getView().byId("lineItemsList").removeSelections(true);
            this.getView().unbindContext("SelectedPerson");
        },


        /**
         * Set the full screen mode to false and navigate to list page
         */
        onCloseDetailPress: function () {
            this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
            // No item should be selected on list after detail page is closed
            this.getOwnerComponent().oListSelector.clearListListSelection();
            this.getRouter().navTo("list");
        },

        /**
         * Toggle between full and non full screen mode.
         */
        toggleFullScreen: function () {
            var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");
            this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
            if (!bFullScreen) {
                // store current layout and go full screen
                this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
                this.getModel("appView").setProperty("/layout", "MidColumnFullScreen");
            } else {
                // reset to previous layout
                this.getModel("appView").setProperty("/layout",  this.getModel("appView").getProperty("/previousLayout"));
            }
        },


        onSelectionChange: function(oEvent){             
            let oSelectedPersonContext = oEvent.getParameters().listItem.getBindingContext();            
            this.getView().setBindingContext(oSelectedPersonContext, "SelectedPerson");
        },
        
        onSavePerson: function(oEvent){    
            this.oMessageManager.removeAllMessages();  
            this.getModel().submitBatch("myUpdateGroup");                  
        },

        onCreatePerson: function(oEvent){
            let oNewPersonContext = this.getView().byId("lineItemsList").getBinding("items").create({ID: 0});            
            this.getView().setBindingContext(oNewPersonContext, "SelectedPerson");
            //Set the new line item as selected
            let aItems = this.getView().byId("lineItemsList").getItems();
            aItems.forEach(item => {
                if (item.getBindingContext() === oNewPersonContext) item.setSelected(true);
            });
        },

        onCancelChanges: function(oEvent){            
            this.getModel().resetChanges("myUpdateGroup");
            this.oMessageManager.removeAllMessages();
        },

        onDeletePerson: function(oEvent){
            let oTable = this.getView().byId("lineItemsList");
            let oSelectedItem = oTable.getSelectedItem();
            if(oSelectedItem && oSelectedItem != null){
               let oContextToDelete = oSelectedItem.getBindingContext();
               oContextToDelete.delete()
               .then(()=>{ //Deletion done
                    //Implement success msg
               })
               .catch((oError)=>{ //Error during deletion
                    //Implement error msg
               });
               this.getModel().submitBatch("myUpdateGroup");
            }
        },

        //Set input string value to "" instead of null when emptying the input field
        //Somehow the binding sets the property to null when the value is equal to "" which leads to problems when sending the modification to the backend        
        onChangeInputString: function(oEvent){            
            let sPropertyName = oEvent.getSource().getBindingInfo("value").parts[0].path; //Name of the property  (type string)
            let oContext = oEvent.getSource().getBindingContext("SelectedPerson"); //Get the context of the control (Person)
            if (oContext.getProperty(sPropertyName) === null) {
                oContext.setProperty(sPropertyName, "");
            }
        }
    });

});