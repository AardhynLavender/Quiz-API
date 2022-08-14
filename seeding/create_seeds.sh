#!/bin/bash
if [ ! -f example.seed.json ]
then
  echo could not find seeding template
  exit 1
fi
printf "Creating seed file... "
cp example.seed.json seed-1.json;
cp example.seed.json seed-2.json
if [[ ! -f seed-1.json || ! -f seed-2.json ]];
then
  echo "Failed!"
  exit 1
fi
echo "Success!"
exit 0