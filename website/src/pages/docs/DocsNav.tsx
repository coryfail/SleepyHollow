import { groups, guidesInGroup } from "../../docs";

export default function DocsNav({ current }: { current: string }) {
  return (
    <nav className="docs-nav" aria-label="Documentation">
      {groups.map((group) => (
        <div className="docs-nav__group" key={group.id}>
          <p className="docs-nav__label">{group.title}</p>
          <ul>
            {guidesInGroup(group.id).map((guide) => (
              <li key={guide.route}>
                <a
                  className="docs-nav__link"
                  href={guide.route}
                  aria-current={guide.route === current ? "page" : undefined}
                >
                  {guide.navTitle}
                </a>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );
}
