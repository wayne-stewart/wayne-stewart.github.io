
vim.o.number = true
vim.o.relativenumber = true
vim.o.tabstop = 4
vim.o.shiftwidth = 4
vim.o.expandtab = true
vim.o.smartindent = true
vim.o.wrap = false
vim.o.cursorline = true
vim.o.termguicolors = true
vim.o.scrolloff = 10

vim.cmd('syntax on')
vim.cmd('filetype plugin indent on')
vim.cmd('autocmd Filetype html setlocal ts=2 sw=2 expandtab')

--[[
vim.lsp.config['rust-analyzer'] = {
    cmd = { 'rust-analyzer' },
    filetypes = { 'rs' },
    root_markers = { { 'Cargo.toml' }, '.git' }
}
vim.lsp.enable('rust-analyzer')
--]]



