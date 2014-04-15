#!/bin/bash

rm -rf .git/

git init

git add --all

git commit -m "resetting repo"

git remote add origin https://github.com/sjohnson540/drmb.git

git push -f origin master
