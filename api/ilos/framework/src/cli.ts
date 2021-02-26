#!/usr/bin/env node

import { Bootstrap } from './Bootstrap';
console.log('Bootstraping app...');

Bootstrap.createFromPath().then((app) => {
  const [, , command, ...opts] = process.argv;
  app
    .boot(command, ...opts)
    .then(() => {
      console.info(`

        |      ,sss.
      | | |    $^,^$       ██╗██╗      ██████╗ ███████╗
      |_|_|   _/$$$\\_      ██║██║     ██╔═══██╗██╔════╝
        |   /'  ?$?  \`.    ██║██║     ██║   ██║███████╗
        ;,-' /\\ ,, /. |    ██║██║     ██║   ██║╚════██║
        '-./' ;    ;: |    ██║███████╗╚██████╔╝███████║
        |     |\`  '|\`,;    ╚═╝╚══════╝ ╚═════╝ ╚══════╝
      ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
`);
    })
    .catch((e) => {
      console.error(e.message, e);
      process.exit(1);
    });
});
