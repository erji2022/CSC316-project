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
of human activity. Using data from NASA, WHO, and other reputable sources, the project presents visual narratives on:

- **Climate Change:** Global temperature anomalies alongside CO₂ levels and sea level rise.
- **Air Quality:** An interactive tree map and line charts comparing pollutant metrics (PM2.5, NO₂, PM10) by region or
  country.
- **Plastic Waste:** A pie chart visualizing waste management categories.
- **Water Quality:** A heatmap showing pH trends over time with interactive filtering.

---

## Key Features

- **Scroll-Driven Narrative:** Seamless navigation with dot indicators and smooth scrolling between themed pages.
- **Dynamic Visualizations:**
    - **Combined Chart:** Merges temperature, CO₂, and sea level data into one interactive visualization.
    - **Air Quality Tree Map:** Sorts air quality metrics with options to view data by country or region.
    - **Plastic Waste Pie Chart:** Visualizes proportions of different waste management methods.
    - **Water Quality Heatmap:** Displays pH level trends with year-range filters and detailed tooltips.
- **Responsive Design:** Automatically adapts to different screen sizes with dynamic resizing for charts and tooltips.
- **Rich Interactivity:** Hover effects, filtering options, and sorting controls allow users to explore detailed data
  insights.

---

## Project Structure

```
CSC316-project/
├── css/
│   └── style.css                                     # Custom styles for layout and visualizations
├── data/
│   ├── air_quality.csv                               # WHO air quality data (PM2.5, NO₂, PM10)
│   ├── co2-1850.txt                                  # Historical CO₂ data (1850+)
│   ├── co2-mm-mlo.txt                                # Modern CO₂ data (Mauna Loa)
│   ├── global-average-absolute-sea-level-change.csv  # Sea level data
│   ├── gmsl.txt                                      # Additional sea level dataset
│   ├── land-ocean-temperature.txt                    # Global temperature anomaly data
│   ├── pH.csv                                        # Water quality pH data
│   └── waste.csv                                     # Global plastic waste data and management figures
├── js/
│   ├── main.js                                       # Entry point: initializes page modules and scroll manager
│   ├── scroll.js                                     # Custom scroll and dot navigation manager
│   ├── airQualityChart.js                            # Air quality tree map and trend line charts logic
│   ├── CombinedChart.js                              # Merges temperature, CO₂, and sea level data into one visualization
│   ├── pH.js                                         # Renders water quality pH heatmap with interactive filtering
│   ├── pieChart.js                                   # Builds the plastic waste pie chart
│   ├── page0.js                                      # Introduction and overview page
│   ├── page1.js                                      # Climate change visualization page
│   ├── page2.js                                      # Air quality visualization page
│   ├── page3.js                                      # Plastic waste visualization page
│   ├── page4.js                                      # Water quality visualization page
│   └── page5.js                                      # Conclusion and call-to-action page
├── index.html                                        # Main HTML file with page containers and script references
└── README.md                                         # Project documentation (this file)
```

### File Descriptions

- **`index.html`:**  
  The main HTML file that brings together all components of the interactive experience. It loads Bootstrap, D3.js, and
  the custom JavaScript modules.

- **`css/style.css`:**  
  Contains styling for layout, typography, color schemes, and responsive behaviors.

- **`js/main.js`:**  
  Orchestrates the initialization of individual pages and the scroll navigation manager.

- **Visualization Modules (inside `js/`):**  
  Each file (e.g., `airQualityChart.js`, `CombinedChart.js`, `pH.js`, `pieChart.js`) handles the loading, processing,
  and rendering of its corresponding data visualization. These modules include interactivity like tooltips, filtering,
  and sorting.

- **Page Modules (`page0.js` – `page5.js`):**  
  These files are responsible for initializing and managing content for each specific page of the interactive narrative.
  Each page module sets up its unique DOM elements, binds necessary event listeners, and calls upon visualization
  modules as needed. This modular structure ensures that each section of the story (from introduction through
  conclusion) is handled independently, keeping the code organized and maintainable.

---

## Data Sources

Data for the project is sourced from reputable organizations:

- **NASA Global Climate Change Data:**
    - [Global Temperature Data](https://climate.nasa.gov/vital-signs/global-temperature/)
    - [CO₂ Concentration Data](https://climate.nasa.gov/vital-signs/carbon-dioxide/)

- **CO₂ Sustainability Data:**

  Data from 1800 to 1954 is sourced from [here](https://sealevel.info/co2.html).

- **WHO Ambient Air Quality Database:**  
  Provides [data](https://www.who.int/publications/m/item/who-ambient-air-quality-database-(update-jan-2024)) on PM2.5,
  NO₂, and PM10 levels.

- **Plastic Waste Data:**  
  Sourced from datasets available
  on [KAPSARC](https://datasource.kapsarc.org/explore/dataset/global-plastic-waste/export/?disjunctive.year)
  and [Kaggle](https://www.kaggle.com/datasets/prajwaldongre/global-plastic-waste-2023-a-country-wise-analysis).

- **Sea Level Data:**  
  Includes datasets from [DataHub](https://datahub.io/core/sea-level-rise) and other global studies.

- **Water Quality Data:**  
  Collected from
  the [GEMStat](https://portal.gemstat.org/applications/public.html?publicuser=PublicUser#gemstat/Stations) portal and
  other environmental monitoring agencies.

For details on data cleaning and processing, please refer to
our [Process Book](https://docs.google.com/document/d/1h1r1S4xlMGs3ylMiNXfg9rkoJ5Mz3CvG8sUni-EFgtE/edit?tab=t.0#heading=h.uc0363rq9aec).

---

## Usage

This project is deployed as a static HTML website. Simply open the deployed `index.html` in any modern web browser to
experience the interactive visualizations.

- **URL:** [https://your-deployed-webpage.com](https://your-deployed-webpage.com) *(replace with actual URL)*

No local installation or server setup is required—just a compatible browser and an internet connection to load external
libraries via CDN.

---

## Detailed Interactions

**Scroll Navigation & Dot Indicators:**

- The custom scroll manager (`scroll.js`) handles smooth transitions between pages and updates dot indicators to show
  the current section.

**Climate Change Visualizations (Page 1):**

- **CombinedChart.js:**  
  Integrates temperature anomalies (bars), CO₂ levels (line with circles), and sea level rise (line). Tooltips provide
  detailed values, and an internal legend explains the metrics.

**Air Quality Trends (Page 2):**

- **airQualityChart.js:**  
  Uses a tree map to display air quality data, with node sizes representing pollutant levels. A dropdown enables sorting
  by PM2.5, NO₂, or PM10 and toggling between country and region views. Clicking on a node updates an associated line
  chart with historical trends.

**Plastic Waste Visualization (Page 3):**

- **pieChart.js:**  
  Displays waste management categories (recycled, incinerated, landfilled, mismanaged, and littered) in a pie chart.
  Hover interactions reveal percentage details and a legend clarifies the color scheme.

**Water Quality Analysis (Page 4):**

- **pH.js:**  
  Renders a heatmap showing average water pH values by station over selected year ranges. A dropdown filter allows users
  to focus on specific time periods, and tooltips display station-specific details.

**Final Reflection & Call-to-Action (Page 5):**

- Summarizes key insights from all visualizations.
- Provides a “Restart Story” button to re-experience the narrative.
- Encourages users to learn more and take actionable steps toward sustainability.

---

## Process Documentation

Comprehensive documentation detailing design decisions, data cleaning processes, user testing feedback, and iterative
improvements is available in
our [Process Book PDF](https://docs.google.com/document/d/1h1r1S4xlMGs3ylMiNXfg9rkoJ5Mz3CvG8sUni-EFgtE/edit?tab=t.0#heading=h.uc0363rq9aec).

---

## Live Demo & Screencast

- **Live Website:**  
  [https://your-deployed-webpage.com](https://your-deployed-webpage.com) *(replace with actual URL)*

- **Screencast Video:**  
  [Our Planet at a Crossroads: An Interactive Data Journey](https://drive.google.com/file/d/1uxrWqVpcrnrk6wjTXe5oOWIQ2B2l8dqh/view?usp=sharing)

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

---