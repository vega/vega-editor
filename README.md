# Vega Editor

The **Vega editor** is a web application for authoring and testing [Vega](http://github.com/vega/vega) visualizations. It includes a number of example specifications that showcase both the visual encodings and interaction techniques supported by Vega.

### Usage Instructions

To run the editor locally, you must first install the dependencies and then launch a local web server. 

1. `npm install` and link vega and vega-lite. This is necessary right now because neither vega, nor vega-lite ship compiled files. 

2. Run `npm run vendor` to install 3rd party vendor libraries. This command will copy the needed files into the `vendor` folder.

3. Launch a local web server to run the editor. For example, if you have Python installed on your system, run `npm start` in the top-level directory of this project and then point your browser to [http://localhost:8000/](http://localhost:8000/).

### Local Testing & Debugging

The editor is useful for testing if you are involved in Vega and Vega-Lite development. To use Vega, Vega-Lite, Vega Datasets, or Vega-Embed from another directory on your computer, link it into vendor. For this, run `npm link` in the directory of the library that you want to link. Then link a library into `vendor` with `npm run vendor -- -l LIBRARY`. This script also automatically links the node modules to your local library directory (if you previously ran `npm link` in that directory).

For example, to link Vega and Vega-Lite, run

```bash
cd VEGA_DIR
npm link

cd VEGA_LITE_DIR
npm link

cd VEGA_EDITOR_DIR
npm run vendor -- -l vega-lite -l vega
```
