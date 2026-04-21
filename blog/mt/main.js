import { DB } from "./microtag-db.js";

// Configs and options.
const ENABLE_POSTS=0; // If post title and commentary appears or not.
const POSTS_PER_PAGE=15; // How many images appears in each page.
const SHOW_TITLES_IN_GALLERY=0; // If post title is shown in gallery.

// Gallery/Search.
function handleTagView(params) {

  // Get tags and page from URL.
  let values = params.split("&");
  let tagParam = values[0].substring(2);
  let pageParam = values[1] ? values[1].substring(2) : "1";
  tagParam = decodeURIComponent(tagParam);
  const page = parseInt(pageParam);

  // Insert tags in search input for convenience.
  document.getElementById('searchInput').value =
    tagParam.replace(/\+/g, " ");

  // Prepare the query.
  const query = tagParam.trim()
    .split('+')
    .map(tag => tag.trim().toLowerCase())
    .filter(tag => tag !== "");

  // Separate positive from negative.
  const positive_query = query.filter(item => !item.startsWith("-"));
  const negative_query = query.filter(item =>  item.startsWith("-"))
    .map(tag => tag.slice(1))
    .filter(tag => tag !== "");

  // Positive: This filters the tags that should appear.
  let selected = DB.files.filter(file =>
    positive_query.every(tag =>
      file.tags.some(t => t.toLowerCase() === tag)
    )
  );
  
  // Negative: This filters the tags that should NOT appear.
  // Now it filters from positive_query array.
  if (negative_query.length > 0) {
    selected = selected.filter(file =>
      !negative_query.some(tag =>
        file.tags.some(t => t.toLowerCase() === tag)
      )
    );
  }

  // Check if the query found anything.
  if (selected.length > 0) {
    // If so, display.
    renderGalleryWithPagination(selected, page, tagParam);
  } else {
    document.getElementById('gallery').innerHTML = `Nothing found.`;
  }
}

// This calls the functions to render both gallery and pagination.
function renderGalleryWithPagination(selected, page, tagParam) {
  const imagesPerPage = POSTS_PER_PAGE;
  const pages = Math.ceil(selected.length / imagesPerPage);

  // Final selections refers to the content that will
  // be displayed in current page. Like a LIMIT.
  const finalSelection = selected.slice(
    imagesPerPage * (page - 1),
    imagesPerPage * page
  );

  // Call funcs.
  renderPagination(pages, page, tagParam);
  renderGallery(finalSelection);
}


// This controls pagination.
function renderPagination(pages, currentPage, tagParam) {
  let pagination = '';

  // Make the previous link.
  if (currentPage > 1) {
    pagination += `<a href="?t=${tagParam}&p=1">⇤</a> <a href="?t=${tagParam}&p=${currentPage-1}">←</a>`
  }

  if (pages <= 15) {
    // If there are up to 15 pages, just print them.
    for (let i = 1; i <= pages; i++) {
      if (currentPage == i) {
        pagination += `<span> ${i} </span>`;
      } else {
        pagination += `<a href="?t=${tagParam}&p=${i}">${i}</a>`;
      }
    }
  } else {
    // But if there are more pages it gets more complex.
    // Pages before current page.
    for (let i = currentPage - 4; i < currentPage; i++) {
      if (i < 1) {continue};
      pagination += `<a href="?t=${tagParam}&p=${i}">${i}</a>`;
    }
    // Current page.
    pagination += `<span> ${currentPage} </span>`;
    // Pages after current page.
    for (let i = currentPage + 1; i < currentPage + 5; i++) {
      if (i > pages) {continue};
      pagination += `<a href="?t=${tagParam}&p=${i}">${i}</a>`;
    }
  }

  // Make the next link.
  if (currentPage < pages) {
    pagination += `<a href="?t=${tagParam}&p=${currentPage+1}">→</a> <a href="?t=${tagParam}&p=${pages}">⇥</a>`
  }

  // Prints.
  document.getElementById('pagination').innerHTML = pagination;
}

// This controls how the gallery is displayed.
function renderGallery(files) {
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';

  // Create a thumb link for each file.
  for (let file of files) {
    let filename = `${file.md5}.${file.ext}`;
    let thumbURL = `../t/${file.md5}.webp`;
    let fileTags = file.tags.toString();

    // HTML for the thumb/link.
    let img = `
      <a href="?f=${filename}#auto-focus">
        <div class="thumb-box">
          ${SHOW_TITLES_IN_GALLERY ? file.title : ''}        
          <img style="display:block" class="thumb ext-${file.ext}"
               src="${thumbURL}"
               alt="Thumbnail not found.">
          <span class="ext-${file.ext}-text">${file.ext} / ${file.filesize}</span>
        </div>
      </a>
    `;
    
    // Simply appends the thumb/link.
    gallery.innerHTML += img;
  }
}


// This controls how the files are displayed.
function handleFileView(params) {
  let values = params.split("&");

  // Gets the filename from URL, so it knows what to show.
  let filename = values[0].substring(2);
  filename = decodeURIComponent(filename);

  // Get file tags from DB.
  const filemeta = DB.files.filter(file => file.md5 === filename.split(".")[0])[0];
  let tags= filemeta.tags;

  // Make the page title show the tags.
  document.title = tags.join(" ").slice(2);

  // URL of the file.
  const fileURL = `../f/${filename}`;

  // Clears the gallery container.
  const gallery = document.getElementById('gallery');
  gallery.innerHTML = '';

  // Render each component separately. 
  renderFileView(fileURL, filename);
  renderFileFitOptions();
  renderFileTags(tags);
  renderMetadataInfo(filename);
}

// This displays the tags of the file.
function renderFileTags(tags) {
  const tagContainer = document.getElementById('tags');

  // Simply append tags.
  for (const tag of tags) {
    tagContainer.innerHTML += `
      <a href="?t=${tag}">${tag}</a>
    `;
  }
}

// Logic for files fit options.
function renderFileFitOptions() {
  window.fitFile = function(fit) {
    let file = document.getElementById("file")

    // Fit the files.
    switch (fit) {
      case "vertical":
        file.style.width = 'initial'
        file.style.height = '95vh' 
        file.style.maxWidth = 'initial'
        file.style.maxHeight = '95vh' 
        break;

      case "horizontal":
        file.style.width = '95vw'
        file.style.height = 'initial' 
        file.style.maxWidth = '95vw'
        file.style.maxHeight = 'initial' 
        break;

      case "original":
        file.style.width = 'initial'
        file.style.height = 'initial' 
        file.style.maxWidth = 'initial'
        file.style.maxHeight = 'initial' 
        break;
    }
  }
}

// Renders metadata, like sha and so.
function renderMetadataInfo(md5) {
  const filemeta = DB.files.filter(file => file.md5 === md5.split(".")[0])[0];
  document.getElementById("metadata").innerHTML = `
    ${filemeta.md5} <br> ${filemeta.timestamp} <br> ${filemeta.ext} / ${filemeta.filesize} <br>
  `;

  // Insert the title and commentary into post if enabled.
  // I should have put it in different functions
  // for organization, but whatever.
  if (ENABLE_POSTS) {
    document.getElementById("post-header-h1").innerHTML = filemeta.title;
    document.getElementById("post-body").innerHTML = filemeta.commentary;
  }
}

// Renders the file display.
function renderFileView(fileURL, filename) {
  let view;
  const gallery = document.getElementById('gallery');
  const ext = filename.split('.').pop().toLowerCase();

  // Check file type.
  switch (ext) {
    case "webm":
    case "mp4":
      view = `
        <video id="file" controls playsinline loop>
          <source src="${fileURL}" type="video/mp4">
        </video>
      `;
      break;
    case "webp":
    case "gif":
    case "jpg":
    case "jpeg":
    case "png":
      view = `<img id="file" src="${fileURL}">`;
      break;
  }

  // Just a div for focusing the image.
  view = '<div id="auto-focus"></div>' + view;

  // This renders the fit options. Guess it should be in
  // the other function, but for now it werks.
  let fitOpts = `<div id="fit-opts">
      <span onclick="fitFile('horizontal')">Fit ←→</span> /
      <span onclick="fitFile('vertical')">Fit ↓↑</span> / 
      <span onclick="fitFile('original')">Original↓</span> / 
      <span><a href="${fileURL}" target="_blank">File↑</a></span>
  </div> <br>`;

  // Renders post. Another thing that is in the wrong place, but werks.
  let post = `<div id="post">
    <div id="post-header">
      <h1 id="post-header-h1">Post Title.</h1><hr>
    </div>
    <div id="post-body">
      Post body...
    </div>
  </div> <br>`;

  // Renders.
  if (ENABLE_POSTS) {
    gallery.innerHTML += view + fitOpts + post;
  } else {
    gallery.innerHTML += view + fitOpts;
  }
}

// This handles search preview.
function enableSearchPreview() {
  const searchInput = document.getElementById("searchInput");
  const searchPreview = document.getElementById("searchPreview");

  searchInput.addEventListener("input", () => {
    const query = searchInput.value.trim().toLowerCase().split(/\s+/).pop();

    searchPreview.innerHTML = "";
    if (!query) return;

    const filtered = DB.info.tags.filter(item =>
      item.toLowerCase().startsWith(query)
    ).slice(0, 15);

    filtered.forEach(item => {
      const li = document.createElement("li");
      li.textContent = item;

      // Add click behavior
      li.addEventListener("click", () => {
        const words = searchInput.value.trim().split(/\s+/);
        // Replace the last word with the clicked item
        words[words.length - 1] = item;
        searchInput.value = words.join(" ") + " "; // add a space after insertion
        searchPreview.innerHTML = ""; // clear preview
        searchInput.focus(); // keep focus in input
      });

      searchPreview.appendChild(li);
    });
  });
}

function main() {
  // Get params from url.
  let params = window.location.search.substring(1);

  // Display storage usage info.
  document.getElementById('gallery').innerHTML = `
    ${DB.info.homeMsg}
    Search something to display content, like * for any tag. <br> 
    ${DB.info.storageMsg}`;

  // Modes.
  if (params.startsWith("t=")) {
    // Gallery mode.
    handleTagView(params);
  } else if (params.startsWith("f=")) {
    // File mode.
    handleFileView(params);
  }

  // Search preview.
  enableSearchPreview();
}

main();
