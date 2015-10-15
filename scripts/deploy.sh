#!/bin/bash
STAGE=gh_pages_stage

# Check if all files are commited
if [ ! -z "$(git status --porcelain)" ]; then
  echo "There are uncommitted files. Please commit or stash first!"
  git status
  exit 1
fi

# Check if gh-pages files are commited
git checkout gh-pages
if [ -z "$(git status --porcelain)" ]; then
  echo "All tracked files are commited. Publishing files to github pages."
else
  echo "There are uncommitted gh-pages files. Please commit or stash first!"
  git status
  git checkout master
  exit 1
fi
git checkout master

# Fresh npm install to ensure no dev changes are included
# move node modules out of the way so npm link remains
mv node_modules temp
npm install

# Populate staging directory
rm -rf $STAGE
mkdir $STAGE
cp -r index.html app node_modules $STAGE

# Copy staged files to gh-pages
git checkout gh-pages
cp -r $STAGE/* .
rm -rf $STAGE

# Add, commit and push files
git add -A

# force add some files we want node_modules, node_modules is ignored by git
git add node_modules/d3/d3.min.js -f
git add node_modules/d3-geo-projection/d3.geo.projection.min.js -f
git add node_modules/d3-cloud/d3.layout.cloud.js -f
git add node_modules/topojson/topojson.js -f
git add node_modules/vega/vega* -f
git add node_modules/vega-embed/vega-embed* -f
git add node_modules/ace-builds/src-min/ace.js -f
git add node_modules/ace-builds/src-min/mode-json.js -f
git add node_modules/ace-builds/src-min/worker-json.js -f

git commit -m "Update deployed files."
git push origin gh-pages

# Restore state
git checkout master
mv temp node_modules
