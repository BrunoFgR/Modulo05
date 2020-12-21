import { getCustomRepository, getRepository, In } from 'typeorm';
import path from 'path';

import loadCsv from '../config/loadCsv';

import TransactionRepository from '../repositories/TransactionsRepository';
import Transaction from '../models/Transaction';
import Category from '../models/Category';

class ImportTransactionsService {
  async execute(filename: string): Promise<Transaction[]> {
    const transactionRepository = getCustomRepository(TransactionRepository);
    const categoryRepository = getRepository(Category);
    const csvFilePath = path.resolve(__dirname, '..', '..', 'tmp', filename);

    const { categories, transactions } = await loadCsv(csvFilePath);

    const categoryExists = await categoryRepository.find({
      where: { title: In(categories) },
    });

    const categoryExitsTitle = categoryExists.map((c: Category) => c.title);

    const addCategotyTitle = categories
      .filter(c => !categoryExitsTitle.includes(c))
      .filter((value, index, self) => self.indexOf(value) === index);

    const newCategory = categoryRepository.create(
      addCategotyTitle.map(title => ({
        title,
      })),
    );

    await categoryRepository.save(newCategory);

    const allCategories = [...categoryExists, ...newCategory];

    const createTransaction = transactionRepository.create(
      transactions.map(transaction => ({
        title: transaction.title,
        type: transaction.type,
        value: transaction.value,
        category: allCategories.find(c => c.title === transaction.category),
      })),
    );

    const transactionSave = transactionRepository.save(createTransaction);

    return transactionSave;
  }
}

export default ImportTransactionsService;
