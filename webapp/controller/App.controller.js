sap.ui.define([
    "./BaseController",
    "sap/ui/model/json/JSONModel"
], function (BaseController, JSONModel) {
    "use strict";

    return BaseController.extend("fr.stms.testodatav4.controller.App", {

        onInit : function () {
            var oViewModel;

            oViewModel = new JSONModel({
                delay : 0,
                layout : "OneColumn",
                previousLayout : "",
                actionButtonsInfo : {
                    midColumn : {
                        fullScreen : false
                    }
                }
            });
            this.setModel(oViewModel, "appView");

            // apply content density mode to root view
            this.getView().addStyleClass(this.getOwnerComponent().getContentDensityClass());
        }

    });
});