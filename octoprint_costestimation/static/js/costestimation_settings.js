/*
 * View model for OctoPrint-CostEstimation
 *
 * Author: Sven Lohrmann <malnvenshorn@gmail.com>
 * License: AGPLv3
 */

$(function() {

    function FilamentEditorViewModel(filaments) {
        var self = this;

        self.filaments = filaments;
        self.selected = ko.observable(undefined);

        self.name = ko.observable();
        self.cost = ko.observable();
        self.weight = ko.observable();
        self.density = ko.observable();
        self.diameter = ko.observable();

        self.loadData = function(id){
            self.filaments().forEach(function(item) {
                if (item.id() == id) {
                    self.name(item.name);
                    self.cost(item.cost);
                    self.weight(item.weight);
                    self.density(item.density);
                    self.diameter(item.diameter);
                }
            });
        };
    }

    function CostEstimationSettingsViewModel(parameters) {
        var self = this;

        self.settings = parameters[0];

        self.filaments = ko.observableArray([]);
        self.tools = ko.observableArray([]);

        self.filamentDialog = undefined;
        self.editor = undefined;

        self.onStartup = function() {
            self.filamentDialog = $("#settings_plugin_costestimation_filamentdialog");
        };

        self.onBeforeBinding = function() {
            self.filaments = self.settings.settings.plugins.costestimation.filaments;
            self.editor = new FilamentEditorViewModel(self.filaments);
            self._readExtruderCount();
            self.settings.printerProfiles.currentProfileData.subscribe(function() {
                self._readExtruderCount();
            });
        };

        self.showFilamentDialog = function() {
            self.filamentDialog.modal("show");
        };

        self.removeFilament = function(id) {
            self.filaments.remove(function(item){ return item.id() == id; });
        };

        self.addFilament = function() {
            var lastId = self.settings.settings.plugins.costestimation.lastId;
            var nextId = lastId() + 1;
            lastId(nextId);

            var newObj = {
                id: ko.observable(nextId),
                name: ko.observable(""),
                cost: ko.observable(0),
                weight: ko.observable(0),
                density: ko.observable(0),
                diameter: ko.observable(0)
            };

            self.filaments.push(newObj);
            self.editor.selected(nextId);
            self.editor.loadData(nextId);
        };

        self._readExtruderCount = function() {
            var currentProfileData = self.settings.printerProfiles.currentProfileData();
            var numExtruders = (currentProfileData ? currentProfileData.extruder.count() : 0);
            self.tools(new Array(numExtruders));

            var selectedFilament = self.settings.settings.plugins.costestimation.selectedFilament;
            var selectedFilamentCount = Object.keys(selectedFilament).length;

            if (selectedFilamentCount < numExtruders) {
                // add observables for new tools
                for(var i = selectedFilamentCount; i < numExtruders; ++i) {
                    var id = "tool" + i;
                    selectedFilament[id] = ko.observable(0);
                }
            }
        };
    }

    OCTOPRINT_VIEWMODELS.push({
        construct: CostEstimationSettingsViewModel,
        dependencies: ["settingsViewModel"],
        elements: ["#settings_plugin_costestimation",
            "#settings_plugin_costestimation_filamentdialog"]
    });
});
