---

Example plain HTML website using GitLab with [Netlify](https://www.netlify.com/).

---

## Netlify Configuration

In order to build this site with Netlify, simply log in or register at 
https://app.netlify.com/, then select "New site from Git" from the top
right. Select GitLab, authenticate if needed, and then select this
project from the list. 

You will need to set the publish directory to `/public`. Netlify will handle the 
rest.

In the meantime, you can take advantage of all the great GitLab features
like merge requests, issue tracking, epics, and everything else GitLab has
to offer.

## Did you fork this project?

If you forked this project for your own use, please go to your project's
**Settings** and remove the forking relationship, which won't be necessary
unless you want to contribute back to the upstream project.

## Troubleshooting

1. CSS is missing! That means that you have wrongly set up the CSS URL in your
   HTML files. Have a look at the [index.html] for an example.

[index.html]: https://gitlab.com/pages/plain-html/blob/master/public/index.html
