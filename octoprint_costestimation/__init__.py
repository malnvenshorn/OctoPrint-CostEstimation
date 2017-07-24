# coding=utf-8
from __future__ import absolute_import

__author__ = "Sven Lohrmann <malnvenshorn@gmail.com>"
__license__ = "GNU Affero General Public License http://www.gnu.org/licenses/agpl.html"
__copyright__ = "Copyright (C) 2017 Sven Lohrmann - Released under terms of the AGPLv3 License"

import octoprint.plugin


class CostEstimationPlugin(octoprint.plugin.SettingsPlugin,
                           octoprint.plugin.AssetPlugin,
                           octoprint.plugin.TemplatePlugin):

    # SettingsPlugin

    def get_settings_defaults(self):
        return dict(
            lastId=0,
            filaments=[
                dict(
                    id=0,
                    name="_default_",
                    weight=1000,        # g
                    cost=20,            # €
                    density=1.25,       # g/cm³
                    diameter=1.75       # mm
                )],
            selectedFilament=dict(tool0=0),
            powerConsumption=0.2,       # kWh
            costOfElectricity=0.25,     # €/kWh
            currency="€",
            currencyFormat="%v %s"      # %v - value, %s - currency symbol
        )

    def get_settings_version(self):
        return 2

    def on_settings_migrate(self, target, current=None):
        if current is None:
            # migrate old settings
            settings = ["weightOfFilament", "costOfFilament", "densityOfFilament", "diameterOfFilament"]

            filaments = self._settings.get(["filaments"])

            for prop in settings:
                value = self._settings.get([prop])
                if value is not None:
                    filaments[0][prop.replace("OfFilament", "")] = value
                    self._settings.set([prop], None)

            self._settings.set(["filaments"], filaments)

    # TemplatePlugin

    def get_template_configs(self):
        return [
            dict(type="settings", custom_bindings=True),
            dict(type="generic", template="costestimation_filamentdialog.jinja2", custom_bindings=True)
        ]

    # AssetPlugin

    def get_assets(self):
        return dict(
            js=["js/costestimation.js"]
        )

    # SoftwareUpdate

    def get_update_information(self):
        return dict(
            costestimation=dict(
                displayName="CostEstimation",
                displayVersion=self._plugin_version,

                # version check: github repository
                type="github_release",
                user="malnvenshorn",
                repo="OctoPrint-CostEstimation",
                current=self._plugin_version,

                # update method: pip
                pip="https://github.com/malnvenshorn/OctoPrint-CostEstimation/archive/{target_version}.zip"
            )
        )


__plugin_name__ = "CostEstimation"


def __plugin_load__():
    global __plugin_implementation__
    __plugin_implementation__ = CostEstimationPlugin()

    global __plugin_hooks__
    __plugin_hooks__ = {
        "octoprint.plugin.softwareupdate.check_config": __plugin_implementation__.get_update_information
    }
