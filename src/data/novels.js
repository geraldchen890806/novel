// Dynamic novel data loader using import.meta.glob
const metaFiles = import.meta.glob('/src/content/novels/*/meta.json', { eager: true });
const chapterFiles = import.meta.glob('/src/content/novels/*/*.md', { eager: true });

function countWords(text) {
  // Count Chinese characters + English words
  const chinese = (text.match(/[\u4e00-\u9fff]/g) || []).length;
  const english = (text.match(/[a-zA-Z]+/g) || []).length;
  return chinese + english;
}

export function getAllNovels() {
  const novels = [];

  for (const [path, meta] of Object.entries(metaFiles)) {
    const slug = path.split('/').slice(-2, -1)[0];
    const data = meta.default || meta;

    // Gather chapters for this novel
    const chapters = [];
    for (const [cPath, chapter] of Object.entries(chapterFiles)) {
      if (cPath.includes(`/${slug}/`)) {
        const filename = cPath.split('/').pop().replace('.md', '');
        const chapterNum = parseInt(filename, 10);
        const fm = chapter.frontmatter || {};
        const rawContent = chapter.rawContent ? chapter.rawContent() : '';
        const wordCount = fm.wordCount || countWords(rawContent);
        chapters.push({
          num: chapterNum,
          filename,
          title: fm.title || `第${chapterNum}章`,
          wordCount,
          Content: chapter.Content,
        });
      }
    }
    chapters.sort((a, b) => a.num - b.num);

    const totalWords = chapters.reduce((sum, c) => sum + c.wordCount, 0);

    novels.push({
      slug,
      ...data,
      chapters,
      totalWords,
      wordCount: totalWords,
    });
  }

  novels.sort((a, b) => a.slug.localeCompare(b.slug));
  return novels;
}

export function getNovel(slug) {
  return getAllNovels().find(n => n.slug === slug);
}
