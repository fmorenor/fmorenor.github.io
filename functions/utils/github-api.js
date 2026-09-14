// GitHub API utilities para commits automáticos
// Usado por /api/publish-article para crear commits y actualizar blog/index.html

const GITHUB_API_URL = "https://api.github.com";

// Helper: calcula SHA-1 hash (para verificación de contenido en GitHub)
async function sha1(message) {
  const encoder = new TextEncoder();
  const data = encoder.encode(message);
  const hashBuffer = await crypto.subtle.digest("SHA-1", data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// Obtiene la rama (main) y su SHA más reciente
export async function getMainBranchSHA(env) {
  const url = `${GITHUB_API_URL}/repos/${env.GITHUB_USERNAME}/${env.GITHUB_REPO}/branches/main`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.commit.sha;
}

// Obtiene el contenido actual de un archivo
export async function getFileContent(env, path) {
  const url = `${GITHUB_API_URL}/repos/${env.GITHUB_USERNAME}/${env.GITHUB_REPO}/contents/${path}`;
  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      "X-GitHub-Api-Version": "2022-11-28",
    },
  });

  if (res.status === 404) return null;
  if (!res.ok) {
    throw new Error(`GitHub API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return {
    sha: data.sha,
    content: atob(data.content), // Decodificar base64
  };
}

// Crea un commit con los archivos especificados
export async function createCommit(env, files, message) {
  const baseSHA = await getMainBranchSHA(env);

  // Crear el árbol (tree) con los archivos
  const treeItems = [];
  for (const file of files) {
    treeItems.push({
      path: file.path,
      mode: "100644", // archivo regular
      type: "blob",
      content: file.content,
    });
  }

  // Crear el tree
  const treeRes = await fetch(
    `${GITHUB_API_URL}/repos/${env.GITHUB_USERNAME}/${env.GITHUB_REPO}/git/trees`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        base_tree: baseSHA,
        tree: treeItems,
      }),
    }
  );

  if (!treeRes.ok) {
    throw new Error(`Failed to create tree: ${treeRes.status}`);
  }

  const treeData = await treeRes.json();

  // Crear el commit
  const commitRes = await fetch(
    `${GITHUB_API_URL}/repos/${env.GITHUB_USERNAME}/${env.GITHUB_REPO}/git/commits`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        tree: treeData.sha,
        parents: [baseSHA],
        message: message,
        author: {
          name: "CartoData Publisher",
          email: "publisher@cartodata.com",
        },
      }),
    }
  );

  if (!commitRes.ok) {
    throw new Error(`Failed to create commit: ${commitRes.status}`);
  }

  const commitData = await commitRes.json();

  // Actualizar la referencia de main
  const refRes = await fetch(
    `${GITHUB_API_URL}/repos/${env.GITHUB_USERNAME}/${env.GITHUB_REPO}/git/refs/heads/main`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${env.GITHUB_TOKEN}`,
        "X-GitHub-Api-Version": "2022-11-28",
      },
      body: JSON.stringify({
        sha: commitData.sha,
      }),
    }
  );

  if (!refRes.ok) {
    throw new Error(`Failed to update main branch: ${refRes.status}`);
  }

  return commitData.sha;
}

// Parser simple para insertar tarjeta en blog/index.html
export function insertArticleCard(indexContent, card) {
  // Buscar la apertura del grid de artículos
  const gridStart = indexContent.indexOf('<div class="blog-articles-grid">');
  if (gridStart === -1) {
    throw new Error("Grid de artículos no encontrado en index.html");
  }

  // Insertar después del <div class="blog-articles-grid">
  const insertPoint = gridStart + '<div class="blog-articles-grid">'.length;

  // Formatear tarjeta con indentación correcta
  const formattedCard = "\n" + card + "\n";

  return (
    indexContent.substring(0, insertPoint) +
    formattedCard +
    indexContent.substring(insertPoint)
  );
}
