(function registerPagination(app) {
  app.renderPagination = function renderPagination({
    container,
    total,
    page,
    pageSize,
    pageSizes = [5, 10, 20],
    onChange
  }) {
    const totalPages = Math.max(1, Math.ceil(total / pageSize));
    const currentPage = Math.min(Math.max(1, page), totalPages);
    const start = (currentPage - 1) * pageSize;
    const end = start + pageSize;

    const pageButtons = Array.from({ length: totalPages }, (_, index) => {
      const pageNumber = index + 1;
      const active = pageNumber === currentPage ? " active" : "";
      return `<button class="page-btn${active}" type="button" data-page-num="${pageNumber}" aria-label="第 ${pageNumber} 页">${pageNumber}</button>`;
    }).join("");

    container.innerHTML = `
      <div class="pagination-summary">
        <span>共 ${total} 条</span>
        <span>第 ${currentPage} / ${totalPages} 页</span>
      </div>
      <div class="pagination-controls">
        <button class="page-btn page-arrow" type="button" data-page-num="${currentPage - 1}" ${currentPage === 1 ? "disabled" : ""} aria-label="上一页">‹</button>
        <div class="page-number-group">${pageButtons}</div>
        <button class="page-btn page-arrow" type="button" data-page-num="${currentPage + 1}" ${currentPage === totalPages ? "disabled" : ""} aria-label="下一页">›</button>
        <select class="page-size" aria-label="每页条数">
          ${pageSizes.map(size => `<option value="${size}" ${size === pageSize ? "selected" : ""}>${size} 条/页</option>`).join("")}
        </select>
      </div>
    `;

    container.onclick = event => {
      const button = event.target.closest("[data-page-num]");
      if (!button || button.disabled) return;
      onChange({ page: Number(button.dataset.pageNum), pageSize });
    };

    container.querySelector(".page-size").onchange = event => {
      onChange({ page: 1, pageSize: Number(event.target.value) });
    };

    return { page: currentPage, pageSize, totalPages, start, end };
  };
})(window.AdminApp);
