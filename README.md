# OctoPrint-CostEstimation

This OctoPrint plugin displays the estimated print cost for the loaded model. The print cost includes the price for the used filament and the operating cost for the printer.

**Note:** It is planned to remove the filament profiles and use the backend of my [FilamentManager](https://github.com/malnvenshorn/OctoPrint-FilamentManager) plugin instead as soon as it is in a usable state.

## Features
- Calculation based on the provided filament length
- Customizable currency symbol
- Hide cost if not logged in (optional)
- Support for multiple extruders
- Support for filament profiles with [Filament Manager Plugin](https://github.com/malnvenshorn/OctoPrint-FilamentManager)

## Setup

Install via the bundled [Plugin Manager](https://github.com/foosel/OctoPrint/wiki/Plugin:-Plugin-Manager)
or manually using this URL:

    https://github.com/malnvenshorn/OctoPrint-CostEstimation/archive/master.zip

This Plugin requires the [Filament Manager Plugin](https://github.com/malnvenshorn/OctoPrint-FilamentManager) to work. Make sure it is installed.

## Screenshots

![CostEstimation](screenshots/costestimation.png?raw=true)

![CostEstimation Settings](screenshots/costestimation_settings.png?raw=true)
