const JSON_BLOB_URL = "https://jsonblob.com/api/jsonBlob/1346491622271148032";
const divRow = document.getElementById("web-content");
let posts = []; // array that will be used to store the JSONBlob data when called and will be used to display posts.

document.getElementById("userSearch").addEventListener("keyup", searchBar); // listen for user to use search bar and then run the searchBar function.

/* Function to fetch the JSONBlob that holds the public posts and chats. */
async function fetchJSON(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
  return response.json();
}

/* Function to load all of the posts to the page */
async function loadPosts() {
  posts = await fetchJSON(JSON_BLOB_URL);
  displayPosts(posts);
}

/* This function displays all posts in an ordered way using bootstrap cards. */
function displayPosts(filteredPosts) {
  divRow.innerHTML = "";

  filteredPosts.forEach(post => {
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
    cardLink.setAttribute("href", "chats.html");
    cardLink.classList.add("card-link");
    cardLink.innerText = "Check out this Conversation";
    cardData.appendChild(cardLink);

    postCard.appendChild(cardData);
    postCol.appendChild(postCard);
    divRow.appendChild(postCol);
  });
}

/* This function handles the cases of the user using the search bar to find posts on the website. */
function searchBar() {
  let input = document.getElementById("userSearch").value.toLowerCase(); // search input that is then turned lowercase to filter.
  let searchBar = document.getElementById("searchbar"); // grabbing the searchbar for animations
  let resultsContainer = document.getElementById("web-content"); // section of the document that will show the results.
  let sectionHeader = document.getElementById("sectionHeader"); // header of the results section that will change based on use of search bar.

  let filteredPosts = posts.filter(post =>
    post.chat_summary["title"].toLowerCase().includes(input) // variable that will filter the titles of each of the posts that include what is in the input. Uses the array filter method
  );

  displayPosts(filteredPosts); // load all of the posts using the filtered posts.

  /* These sets of conditionals deal with the animations based on user interaction with the searchbar. */
  if (input === "") {  // If there is no input in the search bar, the search bar moves back to its original location and the header is changed back to show all recent posts.
    searchBar.style.marginTop = "0px";
    window.scrollTo({ top: 0, behavior: "smooth" });
    sectionHeader.innerText = "Recent AI Posts from our Users";
  } else if (filteredPosts.length > 0) { // If there are search results, move the search bar and scroll screen to search results and change the header to 'Search Results'.
    searchBar.style.transition = "all 0.5s ease-in-out";
    searchBar.style.marginTop = "800px";
    resultsContainer.scrollIntoView({ behavior: "smooth", block: "start" });
    sectionHeader.innerText = "Search Results";
  } else { // If there are no results, move search bar back to original position and scroll the screen to show the 'results not found' message.
    searchBar.style.marginTop = "0px";
    sectionHeader.innerText = "No Results Found :(";
    resultsContainer.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

loadPosts(); // Load posts for users to see.
