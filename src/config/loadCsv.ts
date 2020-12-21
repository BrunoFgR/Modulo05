import csvParse from 'csv-parse';
import fs from 'fs';

interface CSVTransaction {
  title: string;
  type: 'income' | 'outcome';
  value: number;
  category: string;
}

interface Data {
  transactions: CSVTransaction[];
  categories: string[];
}

export default async function loadCSV(filePath: string): Promise<Data> {
  const readCSVStream = fs.createReadStream(filePath);

  const parseStream = csvParse({
    from_line: 2,
    ltrim: true,
    rtrim: true,
  });

  const parseCSV = readCSVStream.pipe(parseStream);

  const categories: string[] = [];
  const transactions: CSVTransaction[] = [];

  parseCSV.on('data', async line => {
    const [title, type, value, category] = line.map((cell: string) =>
      cell.trim(),
    );

    if (!title || !type || !value) return;

    categories.push(category);
    transactions.push({ title, type, value, category });
  });

  await new Promise(resolve => {
    parseCSV.on('end', resolve);
  });

  return { categories, transactions };
}
