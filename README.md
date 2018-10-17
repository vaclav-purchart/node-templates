# node-html-templates
Simple, zero-dependency HTML templates for nodejs.

This template engine is intended to run nodejs javascript snippets while generating your your HTML. 
You only need to know javascript and HTML. This template engine is inspired by [EJS](http://ejs.co/) templates.

## Usage:
```javascript
const {renderFile} = require('node-html-templates')(__dirname)

console.log(renderFile('./path/to/my/template.ejs'))
```


## Template examples:
```html
<body>
<%
   const renderer = require('./my-renderer')
   const data = require('lib/data')
   return renderer(data)
%>
</body>
```
> Returned string is used instead of snippet code.


## Return shortcut:
```html
<%= '1234' %>
```
> Above snippet is interpreted as <% return '1234' %> -> no need to write 'returns' for simple code


## Sub-templates:
One template can include other templates via require

`main.template.ejs`:
```html
<body>
  <% return require('./sub.template.ejs')({
    templateTitle: 'custom title',  // <<< template arguments are injected into its global scope
  }) %>
</body>
```

`sub.template.ejs`:
```html
<h1>
  <%
    return `<b>${templateTitle}</b>`  // <<< templateTitle is filled with value from main.template.ejs
  %>
</h1>
```

See `./tests` folder for more examples.


## Notes:
- For intellisense & color highlighting use EJS file extensions.
- Each template snippet is sandboxed by node's VM interface.
- Sub-templates inherits parent template parameters (but they can be overwritten by inline parameters)
- Module requires:
  - `'./'` refer to a current template directory
  - `'lib/data'` resolves as `${projectRoot}/lib/data`
