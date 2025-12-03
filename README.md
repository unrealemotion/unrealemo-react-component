# unrealemo-react-component

A collection of elegant, reusable React components for data-heavy applications.

## Installation

```bash
bun add unrealemo-react-component
# or
npm install unrealemo-react-component
# or
yarn add unrealemo-react-component
```

## Components

### FilterableTable

A powerful data table with advanced filtering, sorting, column visibility control, and CSV export.

```tsx
import { FilterableTable, type ColumnDefinition } from "unrealemo-react-component";
import "unrealemo-react-component/styles";

interface User {
  id: number;
  name: string;
  email: string;
}

const columns: ColumnDefinition<User>[] = [
  { key: "id", label: "ID", width: "80px" },
  { key: "name", label: "Name" },
  { key: "email", label: "Email" },
];

function App() {
  const [users, setUsers] = useState<User[]>([]);

  return (
    <FilterableTable
      data={users}
      columns={columns}
      defaultSort={{ column: "name", direction: "asc" }}
      showExport
      allowResize
    />
  );
}
```

## Features

- **Advanced Filtering**: Build complex filter expressions with AND/OR logic and regex support
- **Sorting**: Click column headers to sort (asc → desc → none)
- **Column Visibility**: Show/hide columns dynamically
- **Column Resizing**: Drag column borders to resize
- **CSV Export**: Export visible or all data to CSV
- **Responsive**: Works on all screen sizes
- **TypeScript**: Full type definitions included

## Peer Dependencies

- React 18+
- ReactDOM 18+

## License

MIT

