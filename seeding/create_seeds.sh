#!/bin/bash
if [ $# -ne 1 ];
then
  echo please provide the number of seeds to create!
  exit 1
fi

seeds=$1
if [ $seeds -gt 16 ];
then
  echo Too many seeds!
  exit 1
fi

if [ ! -f example.seed.json ];
then
  echo could not find seeding template
  exit 1
fi

echo "Creating $seeds seed files... "
for i in `seq $seeds`
do
  seed="seed-$i.json"
  if [ ! -f $seed ];
  then
    cp example.seed.json $seed
  else 
    echo $seed already exists... skipping
  fi
done

exit 0