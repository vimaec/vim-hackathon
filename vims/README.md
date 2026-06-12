# vims/

Drop your `.vim` model files into this folder.

The `vim-web` starter app serves everything here automatically: when you run its dev
server (`cd vim-web && npm run dev`), each `.vim` file in this folder appears in the
model picker, and the server streams it to the viewer over a `localhost` URL. Add or
remove files, then reload the page to see the updated list.

## Getting a `.vim` file

- **Export your own** from Revit, Navisworks, or IFC using the VIM exporters (installed
  with [VIM Flex](https://vimaec.com/download)).
- **Use a sample** — for example, download the hosted residence model and save it here:
  <https://storage.cdn.vimaec.com/samples/residence.v1.2.75.vim>
