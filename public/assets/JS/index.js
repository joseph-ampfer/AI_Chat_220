const ALL_POSTS_URL = "/api/pagination"; // public link to the API Endpoint that stores our post data.
const SEARCH_URL = "/api/search"; // public link to the API Endpoint that will query the database for search results.
const divRow = document.getElementById("web-content"); // web content section. Used in multiple functions.
const resultContainer = document.getElementById('result-container');
let currentData; // This is a temp variable that will use the current set of data that is being used.
let searchResults = [];
let posts = []; // array that will be used to store the public post data when called and will be used to display posts.
let lastInput = ''; // string stored when a user is searching to handle unintentional fetching.

/* Object to hold the current dataset.
This will be updated as a user clicks 
to a different page and also determines
how many items are shown on one page. */
let state = { querySet: [], page: 1, rows: 9, window: 5 };

/* Debounce function to handle delay for a user typing in the searchbar */
const debounce = (callback, wait) => {
  let timeoutId = null;
  return (...args) => {
    timeoutId = setTimeout(() => {
      callback(...args);
    }, wait);
  };
};

document.getElementById("userSearch").addEventListener("keyup", debounce(searchBar, 475)); // listen for user to use search bar and then run the searchBar function.

/* Function that reaches out to our API endpoint to fetch posts. */
async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
  return response.json();
}

/* Function to load all of the posts to the page. scrollDown is used for when a user clicks the next page. */
async function renderPosts(posts, scrollDown = false) {

  state.querySet = posts; // set the querySet to our set of posts
  let data = pagination(state.querySet, state.page, state.rows); // create the pages through the use of the pagination function.
  displayPosts(data.querySet); // display the posts that have been trimmed for the page
  pageButtons(data.pages); // create the page buttons

  if (scrollDown) {
    divRow.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}


/* This function displays all posts in an ordered way using bootstrap cards. */
function displayPosts(filteredPosts) {
  divRow.innerHTML = ""; // clear the divRow to load the posts.

  for (let i = 0; i < filteredPosts.length; i++) {
    let post = filteredPosts[i];

    let postCol = document.createElement("div");
    postCol.classList.add("col-12", "col-md-6", "col-lg-4");

    let postCard = document.createElement("div");
    // apply both the Bootstrap base .card and our custom styling
    postCard.classList.add("card", "card-custom");
    // no more inline width/margin

    let cardData = document.createElement("div");
    cardData.classList.add("card-body");

    let cardTitle = document.createElement("h5");
    cardTitle.classList.add("card-title");
    cardTitle.innerText = post.chat_summary.title;
    cardData.appendChild(cardTitle);

    let cardAuthor = document.createElement("h6");
    // use the subtitle class for smaller, muted text
    cardAuthor.classList.add("card-subtitle");
    cardAuthor.innerText = `Chat by: ${post.username}`;
    cardData.appendChild(cardAuthor);

    let cardText = document.createElement("p");
    cardText.classList.add("card-text");
    cardText.innerText = post.chat_summary.summary;
    cardData.appendChild(cardText);

    let cardLink = document.createElement("a");
    cardLink.setAttribute("href", `chat?chatId=${post._id}`);
    cardLink.dataset.index = i;
    cardLink.classList.add("card-link");
    cardLink.innerText = "Check out this Conversation →";
    cardData.appendChild(cardLink);

    postCard.appendChild(cardData);

    postCol.appendChild(postCard);
    divRow.appendChild(postCol);
  }
}


/* This function handles the cases of the user using the search bar to find posts on the website. */
async function searchBar() {
  let input = document.getElementById("userSearch").value.toLowerCase(); // search input that is then turned lowercase to filter.
  let searchBar = document.getElementById("searchbar"); // grabbing the searchbar for animations
  let sectionHeader = document.getElementById("sectionHeader"); // header of the results section that will change based on use of search bar.
  let paginationWrapper = document.getElementById("pagination-wrapper"); // pagination wrapper section, will be hidden during searches.
  let response;
  try {
    if (input) {
      if (lastInput == input) return;
      lastInput = input;
      response = await fetch(`/api/search/${input}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        },
      });
      state.page = 1; // Return the user back to page one if they start a new search.
      searchResults = await response.json(); // Store the returned results into the searchResults variable.
      currentData = searchResults // User is searching, set this boolean to true.
      renderPosts(currentData); // load all of the posts using the filtered posts.
    }
  } catch (err) {
    console.log('error with search', err);
  }


  /* These sets of conditionals deal with the animations based on user interaction with the searchbar. */
  if (input === "") {
    // If there is no input in the search bar, the search bar moves back to its original location and the header is changed back to show all recent posts.
    searchBar.classList.remove("sticky");
    searchBar.classList.add("start");
    window.scrollTo({ top: 0, behavior: "smooth" });
    sectionHeader.innerText = "Recent Chat Posts from our Users";
    paginationWrapper.style.display = "block";
    currentData = posts
    renderPosts(currentData);
  } else if (searchResults.length > 0) {
    // If there are search results, move the search bar and scroll screen to search results and change the header to 'Search Results'.
    searchBar.style.transition = "all 0.5s ease-in-out";
    searchBar.classList.add("sticky");
    searchBar.classList.remove('start');

    const y = document.getElementById('searcharea').getBoundingClientRect().bottom + window.scrollY;
    window.scrollTo({ top: y, behavior: 'smooth' });
    sectionHeader.innerText = "Search Results";
  } else {
    // If there are no results, move search bar back to original position and scroll the screen to show the 'results not found' message.
    sectionHeader.innerText = "No Results Found :(";
    divRow.scrollIntoView({ behavior: "smooth", block: "start" });
    paginationWrapper.style.display = "none";
  }
}

/* This function trims a dataset to display correct number of pages of the public posts */
function pagination(querySet, page, rows) {
  let trimStart = (page - 1) * rows;
  let trimEnd = trimStart + rows;

  let trimmedData = querySet.slice(trimStart, trimEnd);

  let pages = Math.ceil(querySet.length / rows); // Round the page numbers up to ensure all posts are shown even if they do not fit the whole set of rows.

  return {
    querySet: trimmedData,
    pages: pages,
  };
};

/* This function creates the page buttons in the pagination. */
function pageButtons(pages) {
  let wrapper = document.getElementById("pagination-wrapper"); // Get the section where pagination will be displayed.
  wrapper.innerHTML = ""; // Clear this area each time it is called so there is no overlap.

  /* Create the previous button and add style/functionality to it. */
  let prevButton = document.createElement("button");
  prevButton.innerText = "Previous";
  prevButton.classList.add("btn", "btn-secondary", "page-nav");
  prevButton.disabled = state.page === 1; // disable the previous button if the page is the first page.
  prevButton.addEventListener("click", function () {
    // on click go to the previous page.
    if (state.page > 1) {
      state.page--;
      renderPosts(currentData, true); // load the posts
    }
  });
  wrapper.appendChild(prevButton); // Add the previous button to the wrapper

  let maxLeft = (state.page - Math.floor(state.window / 2)); // Determine the farthest left a user can go when going through pages.
  let maxRight = (state.page + Math.floor(state.window / 2)); // Determine the farthest right a user can go when going through pages.

  // These sets of conditionals adjust the number that is shown to the left or the right based on how far a user is into the pages.
  if (maxLeft < 1) {
    maxLeft = 1;
    maxRight = state.window;
  };

  if (maxRight > pages) {
    maxLeft = pages - (state.window - 1);

    if (maxLeft < 1) {
      maxLeft = 1;
    };
    maxRight = pages;
  };

  /* This loop will display the number of pages of posts. */
  for (let page = maxLeft; page <= maxRight; page++) {
    let button = document.createElement("button"); // Create page button
    button.value = page; // Set the value to a page
    button.classList.add("page", "btn", "btn-secondary"); // add style
    button.innerText = page; // Button displays page number

    if (page === state.page) {
      // if the current page = to the page that is show, add the active style
      button.classList.add("active");
    }

    button.addEventListener("click", function () {
      // On click, go to the page of posts.
      state.page = parseInt(this.value); // load the next set of pages by changing the page in our state object to the current page.
      renderPosts(currentData, true); // load the posts
    });

    wrapper.appendChild(button); // add this button to the wrapper
  }

  /* Create the next button and add style/functionality to it. */
  let nextButton = document.createElement("button");
  nextButton.innerText = "Next";
  nextButton.classList.add("btn", "btn-secondary", "page-nav");
  nextButton.disabled = state.page === pages; // Set the button to disabled if the current page is the last page.
  nextButton.addEventListener("click", function () {
    // On click go to the next page
    if (state.page < pages) {
      // if current page is greater than the state.page, increase the page.
      state.page++;
      renderPosts(currentData, true); // load the posts
    }
  });
  wrapper.appendChild(nextButton); // add the next button to the wrapper.
};

/* Function to load all posts when the page opens */
async function start() {
  posts = await fetchJSON(ALL_POSTS_URL);
  currentData = posts;
  renderPosts(currentData); // render the posts.
};

start(); // load the posts when the user accesses the page

/* This function creates the link to allow someone to view a public post. */
function redirectAndLoadChat(chat) {
  //const chat = posts[i].chat;
  console.log(chat);
  sessionStorage.setItem("selectedPublicChat", JSON.stringify(chat));

  window.location.href = "chat.html";
};
