const { join } = require("path");

const pug = require("pug");
const markdownToc = require("markdown-toc");
const TurndownService = require("turndown");
const turndownService = new TurndownService();

module.exports = function writeMarkdownFile(data) {
  //console.log(log.paragraph);
  // convert webpage to markdown version
  var html = pug.renderFile(join(__dirname, "index.pug"), data);
  turndownService.remove(["style"]);
  var markdown = turndownService.turndown(html);
  var toc = markdownToc(markdown).content;
  console.log('generate markdown ToC');
  markdown = toc + "\n \n" + markdown; // add table of contents

  //fs.writeFileSync(join(location, "changelog.md"), markdown, "utf-8");
  return markdown;
};
