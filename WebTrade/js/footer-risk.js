(function () {
            document.addEventListener('click', function (e) {
              var btn = e.target.closest && e.target.closest('.footer-risk-trigger');
              if (!btn) return;
              e.preventDefault();
              var det = document.querySelector('.footer-disclosures');
              if (!det) return;
              det.hidden = false;
              det.open = !det.open;
              if (btn.blur) btn.blur();
            });
          })();
