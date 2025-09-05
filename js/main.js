// ========== TOASTR FUNCTION ==========
function showToast(type, message) {
  toastr.options = {
    closeButton: true,
    progressBar: true,
    positionClass: "toast-bottom-right",
    timeOut: "3000"
  };
  toastr[type](message);
}

// ========== DARK MODE WITH LOCALSTORAGE ==========
const btn = document.getElementById("toggleBtn");

if (btn) {
  // Apply saved theme on load
  const savedTheme = localStorage.getItem("theme");
  if (savedTheme === "dark") {
    document.body.classList.add("dark-mode");
    btn.textContent = "🌞";
  }

  btn.addEventListener("click", function () {
    document.body.classList.toggle("dark-mode");

    if (document.body.classList.contains("dark-mode")) {
      btn.textContent = "🌞"; 
      localStorage.setItem("theme", "dark");
      showToast("info", "Dark Mode Enabled 🌙");
    } else {
      btn.textContent = "🌙"; 
      localStorage.setItem("theme", "light");
      showToast("info", "Light Mode Enabled ☀️");
    }
  });
}

// ========== FAVORITES (USERS EXAMPLE) ==========
function toggleFavorite(userId) {
  let favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  if (favorites.includes(userId)) {
    // Remove
    favorites = favorites.filter(id => id !== userId);
    showToast("warning", "Removed from Favorites ⭐");
  } else {
    // Add
    favorites.push(userId);
    showToast("success", "Added to Favorites ⭐");
  }

  localStorage.setItem("favorites", JSON.stringify(favorites));
  renderFavoritesUI(); // update UI if needed
}

function renderFavoritesUI() {
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];
 
  favorites.forEach(id => {
    const favBtn = document.querySelector(`[data-id='${id}'] .fav-btn`);
    if (favBtn) favBtn.classList.add("text-warning"); 
  });
}

// Loader
window.addEventListener("load", function () {
  let loader = document.getElementById("loader");
  let content = document.getElementById("content");

  console.log(loader)
  loader.classList.add("animate__animated", "animate__fadeOut");
  console.log(loader.classList);

  loader.addEventListener("animationend", () => {
    loader.style.display = "none";
    content.style.display = "block";
  });
 
  // After loader, load stats
  loadDashboardStats();
});

// Dashboard Stats
async function loadDashboardStats() {
  try {
    const usersRes = await fetch("https://jsonplaceholder.typicode.com/users");
    const users = await usersRes.json();
    document.getElementById("usersCount").textContent = users.length;

    const postsRes = await fetch("https://jsonplaceholder.typicode.com/posts");
    const posts = await postsRes.json();
    document.getElementById("postsCount").textContent = posts.length;

    const commentsRes = await fetch("https://jsonplaceholder.typicode.com/comments");
    const comments = await commentsRes.json();
    document.getElementById("commentsCount").textContent = comments.length;
  } catch (error) {
    console.error("Error loading stats:", error);
  }
}


$(document).ready(async function () {
  const table = $('#usersTable').DataTable();
  const favorites = JSON.parse(localStorage.getItem("favorites")) || [];

  // Fetch users from API
  try {
    const res = await fetch("https://jsonplaceholder.typicode.com/users");
    const users = await res.json();

    users.forEach(user => {
      addRow(user);
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    toastr.error("Failed to load users");
  }

  // Add row function
  function addRow(user) {
    const isFav = favorites.includes(user.id);
    const favIcon = isFav ? "⭐" : "☆";

    table.row.add([
      user.id,
      user.name,
      user.username,
      user.email,
      `
        <button class="btn btn-sm btn-info details-btn">Details</button>
        <button class="btn btn-sm btn-warning edit-btn">Edit</button>
        <button class="btn btn-sm btn-danger delete-btn">Delete</button>
        <button class="btn btn-sm btn-outline-secondary fav-btn">${favIcon}</button>
      `
    ]).draw(false);
  }

  // Handle table actions
  $('#usersTable tbody').on('click', 'button', function () {
    const row = $(this).closest('tr');
    const rowData = table.row(row).data();
    const userId = rowData[0];

    if ($(this).hasClass('details-btn')) {
      toastr.info(`Details: ${rowData[1]} (${rowData[2]}), ${rowData[3]}`);
    }
    else if ($(this).hasClass('edit-btn')) {
      const newName = prompt("Enter new name:", rowData[1]);
      if (newName) {
        rowData[1] = newName;
        table.row(row).data(rowData).draw();
        toastr.success("User updated");
      }
    }
    else if ($(this).hasClass('delete-btn')) {
      table.row(row).remove().draw();
      toastr.warning("User deleted");
    }
    else if ($(this).hasClass('fav-btn')) {
      if (favorites.includes(userId)) {
        favorites.splice(favorites.indexOf(userId), 1);
        $(this).text("☆");
        toastr.info("Removed from favorites");
      } else {
        favorites.push(userId);
        $(this).text("⭐");
        toastr.success("Added to favorites");
      }
      localStorage.setItem("favorites", JSON.stringify(favorites));
    }
  });

});
$(document).ready(async function () {
  const postsTable = $('#postsTable').DataTable();
  let postIdCounter = 101; // IDs for locally added posts

  // Fetch posts from API
  try {
    const res = await fetch("https://jsonplaceholder.typicode.com/posts");
    const posts = await res.json();

    posts.forEach(post => {
      addPostRow(post.id, post.title, post.body);
    });
  } catch (error) {
    console.error("Error fetching posts:", error);
    toastr.error("Failed to load posts");
  }

  // Add post row
  function addPostRow(id, title, body) {
    postsTable.row.add([
      id,
      title,
      body,
      `
        <button class="btn btn-sm btn-info comments-btn">Comments</button>
        <button class="btn btn-sm btn-warning edit-btn">Edit</button>
        <button class="btn btn-sm btn-danger delete-btn">Delete</button>
      `
    ]).draw(false);
  }

  // Handle Add Post Form
  $('#addPostForm').on('submit', function (e) {
    e.preventDefault();
    const title = $('#postTitle').val();
    const body = $('#postBody').val();

    addPostRow(postIdCounter++, title, body);
    toastr.success("Post added");

    $('#postTitle').val('');
    $('#postBody').val('');
  });

  // Table actions
  $('#postsTable tbody').on('click', 'button', async function () {
    const row = $(this).closest('tr');
    const rowData = postsTable.row(row).data();
    const postId = rowData[0];

    // Show Comments
    if ($(this).hasClass('comments-btn')) {
      try {
        const res = await fetch(`https://jsonplaceholder.typicode.com/comments?postId=${postId}`);
        const comments = await res.json();

        let html = "";
        comments.forEach(c => {
          html += `<div class="mb-2"><b>${c.name}</b> (${c.email})<br>${c.body}</div><hr>`;
        });

        $("#commentsList").html(html);
        const modal = new bootstrap.Modal(document.getElementById('commentsModal'));
        modal.show();
      } catch (error) {
        toastr.error("Failed to load comments");
      }
    }

    // Edit Post
    else if ($(this).hasClass('edit-btn')) {
      const newTitle = prompt("Enter new title:", rowData[1]);
      const newBody = prompt("Enter new content:", rowData[2]);
      if (newTitle && newBody) {
        rowData[1] = newTitle;
        rowData[2] = newBody;
        postsTable.row(row).data(rowData).draw();
        toastr.success("Post updated");
      }
    }

    // Delete Post
    else if ($(this).hasClass('delete-btn')) {
      postsTable.row(row).remove().draw();
      toastr.warning("Post deleted");
    }
  });
});

async function loadComments() {
  try {
    const res = await fetch("https://jsonplaceholder.typicode.com/comments");
    const comments = await res.json();

    const table = $("#commentsTable").DataTable({
      data: comments,
      columns: [
        { data: "id" },
        { data: "postId" },
        { data: "name" },
        { data: "email" },
        { data: "body" },
        {
          data: null,
          render: function (data) {
            return `
              <button class="btn btn-sm btn-info view-btn">View</button>
              <button class="btn btn-sm btn-danger delete-btn">Delete</button>
            `;
          }
        }
      ]
    });

    // View Details
    $('#commentsTable tbody').on('click', '.view-btn', function () {
      const data = table.row($(this).parents('tr')).data();
      document.getElementById("commentDetails").innerHTML = `
        <p><strong>ID:</strong> ${data.id}</p>
        <p><strong>Post ID:</strong> ${data.postId}</p>
        <p><strong>Name:</strong> ${data.name}</p>
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Body:</strong> ${data.body}</p>
      `;
      new bootstrap.Modal(document.getElementById("commentModal")).show();
    });

    // Delete
    $('#commentsTable tbody').on('click', '.delete-btn', function () {
      table.row($(this).parents('tr')).remove().draw();
      toastr.warning("Comment deleted!");
    });

  } catch (error) {
    console.error("Error loading comments:", error);
  }
}


if (document.getElementById("commentsTable")) {
  loadComments();
}
