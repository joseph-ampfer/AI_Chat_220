const JSON_BLOB_URL = "https://jsonblob.com/api/jsonBlob/1346491622271148032"; // public link to the JSONBlob that stores our post data.
const divRow = document.getElementById("web-content"); // web content section. Used in multiple functions.
let state = { // Object to hold the current dataset. This will be updated as a user clicks to a different page and also determines how many items are shown on one page.
  'querySet': [],

  'page': 1,
  'rows': 9,

}
posts = []; // array that will be used to store the JSONBlob data when called and will be used to display posts.
document.getElementById("userSearch").addEventListener("keyup", searchBar); // listen for user to use search bar and then run the searchBar function.

/* Function to fetch the JSONBlob that holds the public posts and chats. */
async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
  return response.json();
}

/* Function to load all of the posts to the page. scrollDown is used for when a user clicks the next page. */
async function loadPosts(scrollDown = false) {
  posts = await fetchJSON(JSON_BLOB_URL);

  state.querySet = posts; // set the querySet to our set of posts from JSONBlob
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
    postCard.classList.add("card");
    postCard.style.width = "20rem";
    postCard.style.margin = "auto";

    let cardData = document.createElement("div");
    cardData.classList.add("card-body");

    let cardTitle = document.createElement("h5");
    cardTitle.classList.add("card-title");
    cardTitle.innerText = post.chat_summary["title"];
    cardData.appendChild(cardTitle);

    let cardAuthor = document.createElement("h6");
    cardAuthor.innerText = `Chat by: ${post.username}`;
    cardData.appendChild(cardAuthor);

    let cardText = document.createElement("p");
    cardText.innerText = post.chat_summary["summary"];
    cardData.appendChild(cardText);

    let cardLink = document.createElement("a");
    cardLink.setAttribute('href', '#');
    cardLink.dataset.index = i;
    cardLink.addEventListener('click', () => redirectAndLoadChat(i));
    cardLink.classList.add("card-link");
    cardLink.innerText = 'Check out this Conversation';
    cardData.appendChild(cardLink);

    postCard.appendChild(cardData);
    postCol.appendChild(postCard);
    divRow.appendChild(postCol);
  }
}


/* This function handles the cases of the user using the search bar to find posts on the website. */
function searchBar() {
  let input = document.getElementById("userSearch").value.toLowerCase(); // search input that is then turned lowercase to filter.
  let searchBar = document.getElementById("searchbar"); // grabbing the searchbar for animations
  let sectionHeader = document.getElementById("sectionHeader"); // header of the results section that will change based on use of search bar.
  let paginationWrapper = document.getElementById("pagination-wrapper"); // pagination wrapper section, will be hidden during searches.

  let filteredPosts = posts.filter(post =>
    post.chat_summary["title"].toLowerCase().includes(input) // variable that will filter the titles of each of the posts that include what is in the input. Uses the array filter method
  );

  displayPosts(filteredPosts); // load all of the posts using the filtered posts.

  /* These sets of conditionals deal with the animations based on user interaction with the searchbar. */
  if (input === "") {  // If there is no input in the search bar, the search bar moves back to its original location and the header is changed back to show all recent posts.
    searchBar.style.marginTop = "0px";
    window.scrollTo({ top: 0, behavior: "smooth" });
    sectionHeader.innerText = "Recent Chat Posts from our Users";
    paginationWrapper.style.display = "block";
    loadPosts();
  } else if (filteredPosts.length > 0) { // If there are search results, move the search bar and scroll screen to search results and change the header to 'Search Results'.
    searchBar.style.transition = "all 0.5s ease-in-out";
    searchBar.style.marginTop = "800px";
    divRow.scrollIntoView({ behavior: "smooth", block: "start" });
    sectionHeader.innerText = "Search Results";
    paginationWrapper.style.display = "none";
  } else { // If there are no results, move search bar back to original position and scroll the screen to show the 'results not found' message.
    searchBar.style.marginTop = "0px";
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
    'querySet': trimmedData,
    'pages': pages
  }
}
/* This function creates the page buttons in the pagination. */
function pageButtons(pages) {
  let wrapper = document.getElementById('pagination-wrapper'); // Get the section where pagination will be displayed.
  wrapper.innerHTML = ''; // Clear this area each time it is called so there is no overlap.

  /* Create the previous button and add style/functionality to it. */
  let prevButton = document.createElement("button");
  prevButton.innerText = "Previous";
  prevButton.classList.add("btn", "btn-secondary", "page-nav");
  prevButton.disabled = state.page === 1; // disable the previous button if the page is the first page.
  prevButton.addEventListener("click", function () { // on click go to the previous page.
    if (state.page > 1) {
      state.page--;
      loadPosts(true); // load the posts
    }
  });
  wrapper.appendChild(prevButton); // Add the previous button to the wrapper

  /* This loop will display the number of pages of posts. */
  for (let page = 1; page <= pages; page++) {
    let button = document.createElement("button"); // Create page button
    button.value = page; // Set the value to a page
    button.classList.add("page", "btn", "btn-secondary"); // add style
    button.innerText = page; // Button displays page number

    if (page === state.page) { // if the current page = to the page that is show, add the active style
      button.classList.add("active");
    }

    button.addEventListener("click", function () { // On click, go to the page of posts.
      state.page = parseInt(this.value); // load the next set of pages by changing the page in our state object to the current page.
      loadPosts(true); // load the posts.
    });

    wrapper.appendChild(button); // add this button to the wrapper
  };

  /* Create the next button and add style/functionality to it. */
  let nextButton = document.createElement("button");
  nextButton.innerText = "Next";
  nextButton.classList.add("btn", "btn-secondary", "page-nav");
  nextButton.disabled = state.page === pages; // Set the button to disabled if the current page is the last page.
  nextButton.addEventListener("click", function () { // On click go to the next page
    if (state.page < pages) { // if current page is greater than the state.page, increase the page.
      state.page++;
      loadPosts(true); // load the posts.
    }
  });
  wrapper.appendChild(nextButton); // add the next button to the wrapper.
}

loadPosts(); // load the posts as soon as someone accesses the page

function redirectAndLoadChat(i) {
  const chat = posts[i].chat;
  console.log(chat);
  sessionStorage.setItem('selectedPublicChat', JSON.stringify(chat));

  window.location.href = 'chat.html';
}
