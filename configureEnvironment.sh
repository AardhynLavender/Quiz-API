#!/bin/bash
if [ ! -f 'template.env' ];
then
	echo template ENV is not present!
	exit 1
fi
if [ -f '.env' ];
then
	echo ENV already present!
	exit 1
fi
>&2 echo found template ENV... 
cp template.env .env
vim .env
exit 0
