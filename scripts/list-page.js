const pageTitle = document.getElementById("page-title");
const postsList = document.getElementById("posts-list");

if (!pageTitle || !postsList) {
  console.warn("list-page.js روی صفحه‌ی نامعتبر اجرا شد");
} else {
  const params = new URLSearchParams(window.location.search);
  const categoryKey = params.get("cat")?.trim();
  const query = params.get("query")?.trim().toLowerCase() || "";

  function renderPosts(posts) {
    postsList.replaceChildren();

    if (!posts.length) {
      const empty = document.createElement("li");
      empty.className = "list-page_empty";
      empty.textContent = query
        ? "نتیجه‌ای برای جستجوی شما پیدا نشد."
        : "هنوز آیتمی در این دسته ثبت نشده است.";
      postsList.appendChild(empty);
      return;
    }

    posts.forEach((item) => {
      const li = document.createElement("li");
      li.className = "list-page_item";

      const body = document.createElement("div");
      body.className = "list-page_item_body";

      const title = document.createElement("h2");
      title.className = "list-page_item_title";
      title.textContent = item.title || "بدون عنوان";

      const excerpt = document.createElement("p");
      excerpt.className = "list-page_item_text";
      excerpt.textContent =
        item.excerpt || "توضیحی برای این آیتم ثبت نشده است.";

      const link = document.createElement("a");
      link.className = "list-page_item_btn";
      link.href = "single-post.html?id=" + encodeURIComponent(item.id);
      link.textContent = "توضیحات بیشتر";

      const image = document.createElement("img");
      image.className = "list-page_item_img";
      image.src = item.image || "../images/ravin.png";
      image.alt = item.title || "تصویر آیتم";
      image.loading = "lazy";

      body.append(title, excerpt, link);
      li.append(body, image);
      postsList.appendChild(li);
    });
  }

  async function loadListPage() {
    const localCategory = typeof siteData !== "undefined" ? siteData[categoryKey] : null;
    let category = localCategory;
    let posts = null;

    // The server is authoritative when connected. Local content is retained
    // only as a static preview fallback for the frontend handoff environment.
    if (typeof appApi !== "undefined" && appApi.content && appApi.content.list) {
      try {
        const response = await appApi.content.list({ category: categoryKey, query: query || undefined });
        if (Array.isArray(response)) posts = response;
        else if (response && Array.isArray(response.items)) {
          posts = response.items;
          category = { title: response.title || (localCategory && localCategory.title) || "محتوا", items: posts };
        }
      } catch (error) {
        console.warn("list-page: دریافت محتوای سرور انجام نشد؛ پیش‌نمایش محلی استفاده می‌شود.", error);
      }
    }

    if (!category && !query) {
      pageTitle.textContent = "دسته پیدا نشد";
      renderPosts([]);
      return;
    }

    if (!category && query && typeof siteData !== "undefined") {
      category = {
        title: "جستجوی سایت",
        items: Object.values(siteData).flatMap((entry) => entry.items || []),
      };
    }

    if (posts === null) {
      posts = (category && Array.isArray(category.items) ? category.items : []).filter((item) => {
        if (!query) return true;
        return [item.title, item.excerpt].some((value) =>
          String(value || "").toLowerCase().includes(query),
        );
      });
    }

    const categoryTitle = (category && category.title) || "جستجوی سایت";
    document.title = categoryTitle + " | بنام آکادمی";
    pageTitle.textContent = query
      ? `نتایج جستجو برای «${query}»`
      : categoryTitle;
    renderPosts(posts);
  }

  loadListPage();
}
