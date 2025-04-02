# Our Planet at a Crossroads

An interactive, scroll-based data visualization project that tells the story of how human activities have reshaped our
environment. By combining multiple datasets and visualization techniques, this project explores trends in climate
change, air quality, plastic waste, and water quality to inform and inspire action.

---

## Table of Contents

- [Project Overview](#project-overview)
- [Key Features](#key-features)
- [Project Structure](#project-structure)
- [Data Sources](#data-sources)
- [Usage](#usage)
- [Detailed Interactions](#detailed-interactions)
- [Process Documentation](#process-documentation)
- [Live Demo & Screencast](#live-demo--screencast)
- [Credits & License](#credits--license)

---

## Project Overview

**Our Planet at a Crossroads** is an immersive web experience designed to educate users about the environmental impact
of human activity. Leveraging data from NASA, WHO, and other reputable sources, the project presents visual narratives
on:

- **Climate Change:** Global temperature anomalies alongside CO₂ levels and sea level rise.
- **Air Quality:** An interactive tree map and line charts comparing pollutant metrics (PM2.5, NO₂, PM10) by region or
  country.
- **Plastic Waste:** A pie chart visualizing waste management categories.
- **Water Quality:** A heatmap showing pH trends over time with interactive filtering.

---

## Key Features

- **Scroll-Driven Narrative:**  
  Seamless navigation with dot indicators and smooth scrolling between themed pages guides the user through the story.

- **Dynamic Visualizations:**
    - **Combined Chart:** Merges temperature, CO₂, and sea level data into one interactive visualization with tooltips
      and legends.
    - **Air Quality Tree Map:** Sorts air quality metrics (PM2.5, NO₂, PM10) by country or region.
    - **Plastic Waste Pie Chart:** Displays proportions of different waste management methods (recycled, incinerated,
      landfilled, mismanaged, and littered) with hover details.
    - **Water Quality Heatmap:** Shows average water pH values by station over selectable year ranges, with interactive
      tooltips.

- **Responsive Design:**  
  The project automatically adapts to different screen sizes, with charts and tooltips dynamically resizing.

- **Rich Interactivity:**  
  Hover effects, filtering options, sorting controls, and clickable nodes allow users to deeply explore the data.

---

## Project Structure

```
CSC316-project/
├── css/
│   └── style.css                                     # Custom styles for layout, typography, and visualizations
├── data/
│   ├── air_quality.csv                               # WHO air quality data (PM2.5, NO₂, PM10)
│   ├── co2-1850.txt                                  # Historical CO₂ data (1850+)
│   ├── co2-mm-mlo.txt                                # Modern CO₂ data (Mauna Loa)
│   ├── global-average-absolute-sea-level-change.csv  # Sea level data
│   ├── gmsl.txt                                      # Additional sea level dataset
│   ├── land-ocean-temperature.txt                    # Global temperature anomaly data
│   ├── pH.csv                                        # Water quality pH data
│   └── waste.csv                                     # Global plastic waste data and management figures
├── images/
│   ├── air-pollution.webp
│   ├── globalWarming.webp
│   ├── meltingIceCaps.jpg
│   ├── plasticOcean.jpg
│   ├── waterPollution.jpg
│   └── ... (other images)
├── js/
│   ├── airQualityChart.js                            # Logic for air quality tree map & trend charts
│   ├── airQualityImgPage.js                          # Page module for the air quality "hero image" or intro
│   ├── airQualityVisPage.js                          # Page module for air quality data visualization
│   ├── climateChangeVisPage.js                       # Page module for climate change data visualization
│   ├── CombinedChart.js                              # Merges temperature, CO₂, sea level data into one chart
│   ├── main.js                                       # Entry point: initializes page modules and scroll manager
│   ├── pHHeatMap.js                                  # Renders water quality pH heatmap with interactive filtering
│   ├── plasticWasteImgPage.js                        # Page module for plastic waste image/intro
│   ├── plasticWastePage.js                           # (If used) Possibly older or combined plastic waste logic
│   ├── plasticWasteVisPage.js                        # Page module for plastic waste data visualization
│   ├── reflectionPage.js                             # Page module for final reflection/call-to-action
│   ├── scroll.js                                     # Custom scroll manager and dot navigation
│   ├── TemperatureCO2Chart.js                        # Standalone chart for temperature vs CO₂
│   ├── TemperatureSeaLevelChart.js                   # Standalone chart for temperature vs sea level
│   ├── titlePage.js                                  # Intro/title page module
│   ├── waterQualityImgPage.js                        # Page module for water quality image/intro
│   └── waterQualityVisPage.js                        # Page module for water quality data visualization
├── index.html                                        # Main HTML file that brings together all components
└── README.md                                         # Project documentation (this file)
```

### File Descriptions

- **`index.html`:**  
  The main HTML file that integrates all components of the interactive experience. It loads external libraries (
  Bootstrap, D3.js) along with the custom JavaScript modules.

- **`css/style.css`:**  
  Contains the styles for the overall layout, typography, color themes, and responsive behavior of the project.

- **`images/`:**  
  Holds various images used throughout the site, including hero images for different sections (climate change, air
  pollution, plastic waste, water pollution, etc.).

- **`js/main.js`:**  
  Orchestrates the initialization of the individual page modules and the scroll navigation manager, ensuring that all
  interactive elements are ready once the DOM loads.

- **Visualization Modules (inside `js/`):**
    - `airQualityChart.js`, `CombinedChart.js`, `pHHeatMap.js`, `TemperatureCO2Chart.js`, `TemperatureSeaLevelChart.js`,
      etc.
        - Each file handles loading, processing, and rendering of specific data visualizations.
        - Includes interactivity like tooltips, filtering, and sorting.

- **Page Modules (inside `js/`):**
    - `titlePage.js`, `climateChangeVisPage.js`, `airQualityImgPage.js`, `airQualityVisPage.js`,
      `plasticWasteImgPage.js`, `plasticWasteVisPage.js`, `waterQualityImgPage.js`, `waterQualityVisPage.js`,
      `reflectionPage.js`, etc.
        - Each module manages a particular “page” or “section” of the narrative, such as a hero image/intro or a data
          visualization.
        - This modular approach keeps code organized and makes it easier to maintain or update individual sections.

- **`scroll.js`:**  
  Implements a custom scroll manager and dot navigation to handle smooth transitions between pages and update the active
  dot indicator.

---

## Data Sources

Data for the project is obtained from reputable organizations:

- **NASA Global Climate Change Data:**
    - [Global Temperature Data](https://climate.nasa.gov/vital-signs/global-temperature/)
    - [CO₂ Concentration Data](https://climate.nasa.gov/vital-signs/carbon-dioxide/)

- **CO₂ Supplementary Data:**  
  Data from 1800 to 1954 is sourced from [here](https://sealevel.info/co2.html).

- **WHO Ambient Air Quality Database:**  
  Provides data on PM2.5, NO₂, and PM10 levels.  
  [Access the data](https://www.who.int/publications/m/item/who-ambient-air-quality-database-(update-jan-2024))

- **Plastic Waste Data:**  
  Available from datasets
  on [KAPSARC](https://datasource.kapsarc.org/explore/dataset/global-plastic-waste/export/?disjunctive.year)
  and [Kaggle](https://www.kaggle.com/datasets/prajwaldongre/global-plastic-waste-2023-a-country-wise-analysis).

- **Sea Level Data:**  
  Includes datasets from [DataHub](https://datahub.io/core/sea-level-rise) and other studies.

- **Water Quality Data:**  
  Sourced from
  the [GEMStat Portal](https://portal.gemstat.org/applications/public.html?publicuser=PublicUser#gemstat/Stations) and
  other environmental monitoring agencies.

For details on data cleaning and processing steps, please refer to
our [Process Book](https://docs.google.com/document/d/1h1r1S4xlMGs3ylMiNXfg9rkoJ5Mz3CvG8sUni-EFgtE/edit?tab=t.0#heading=h.uc0363rq9aec).

---

## Usage

This project is deployed as a static HTML website. Simply open the deployed `index.html` in any modern web browser to
experience the interactive visualizations.

- **URL:** [Our Planet at a Crossroads](https://csc316-project-production.up.railway.app/)

No local installation or server setup is required—just a compatible browser and an internet connection to load external
libraries via CDN.

---

## Detailed Interactions

**Scroll Navigation & Dot Indicators:**

- The custom scroll manager (`scroll.js`) listens for mouse wheel events and updates dot indicators to reflect the
  current section, providing a smooth narrative flow.

**Climate Change Visualizations:**

- **climateChangeVisPage.js:**  
  Integrates temperature anomalies (bars), CO₂ levels (line with circles), and sea level rise (line). Tooltips provide
  detailed values, and an internal legend explains the metrics.

**Air Quality:**

- **airQualityVisPage.js:**  
  Uses a tree map to display air quality data, with node sizes representing pollutant levels. A dropdown enables sorting
  by PM2.5, NO₂, or PM10 and toggling between country and region views. Clicking on a node updates an associated line
  chart with historical trends.

**Plastic Waste:**

- **plasticWasteVisPage.js:**  
  Displays waste management categories (recycled, incinerated, landfilled, mismanaged, and littered) in a pie chart.
  Hover interactions reveal percentage details and a legend clarifies the color scheme.

**Water Quality:**

- **waterQualityVisPage.js:**  
  Renders a heatmap showing average water pH values by station over selected year ranges. A dropdown filter allows users
  to focus on specific time periods, and tooltips display station-specific details.

**Reflection & Conclusion:**

- **reflectionPage.js:**  
  Summarizes key takeaways from all visualizations, encourages sustainable actions, and offers a “Restart Story” button.

---

## Process Documentation

Comprehensive documentation detailing our design decisions, data cleaning processes, user testing feedback, and
iterative improvements is available in
our [Process Book PDF](https://docs.google.com/document/d/1h1r1S4xlMGs3ylMiNXfg9rkoJ5Mz3CvG8sUni-EFgtE/edit?tab=t.0#heading=h.uc0363rq9aec).

---

## Live Demo & Screencast

- **Live Website:**  
  [Our Planet at a Crossroads](https://csc316-project-production.up.railway.app/)

- **Screencast Video:**  
  [Link to Presentation](https://drive.google.com/file/d/1uxrWqVpcrnrk6wjTXe5oOWIQ2B2l8dqh/view?usp=sharing)

---

## Credits & License

**Project Contributors:**

- [Gilbert Ye](mailto:gilbert.ye@mail.utoronto.ca)
- [Yibin Cui](mailto:yibin.cui@mail.utoronto.ca)
- [Erkhjin Oyunbaatar](mailto:erkhjin.oyunbaatar@mail.utoronto.ca)

**Third-Party Libraries:**

- [D3.js v7](https://d3js.org/)
- [Bootstrap 5](https://getbootstrap.com/)
- [TopoJSON](https://github.com/topojson/topojson)
- [d3-scale-chromatic](https://github.com/d3/d3-scale-chromatic)

**License:**

This project is provided for educational and non-commercial use.

---

*Thank you for exploring "Our Planet at a Crossroads." We hope our interactive data story inspires deeper understanding
and meaningful action on global environmental challenges.*