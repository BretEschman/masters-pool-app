#!/bin/bash
export PATH="/Users/mkr421/.nvm/versions/node/v22.17.1/bin:$PATH"
exec npm run dev -- -p ${PORT:-3000}
