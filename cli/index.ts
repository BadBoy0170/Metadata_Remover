#!/usr/bin/env node
import yargs from 'yargs';
import { hideBin } from 'yargs/helpers';
import fs from 'fs/promises';
import path from 'path';
import EXIF from 'exif-js';
import { encryptMetadata, decryptMetadata } from '../src/utils/crypto';

const processImage = async (
  inputPath: string,
  outputPath: string,
  operation: 'remove' | 'encrypt' | 'decrypt',
  password?: string
) => {
  try {
    const imageBuffer = await fs.readFile(inputPath);
    const image = new Image();
    image.src = `data:image/jpeg;base64,${imageBuffer.toString('base64')}`;

    await new Promise((resolve) => {
      image.onload = resolve;
    });

    EXIF.getData(image as any, async function(this: any) {
      const metadata = EXIF.getAllTags(this);
      
      if (operation === 'encrypt' && password) {
        const encryptedData = encryptMetadata(metadata, password);
        await fs.writeFile(`${outputPath}.metadata`, encryptedData);
      } else if (operation === 'decrypt' && password) {
        const encryptedData = await fs.readFile(`${inputPath}.metadata`, 'utf-8');
        const decryptedData = decryptMetadata(encryptedData, password);
        console.log('Decrypted metadata:', decryptedData);
      }

      // Create clean image
      const canvas = document.createElement('canvas');
      canvas.width = image.width;
      canvas.height = image.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(image, 0, 0);

      const cleanImageData = canvas.toDataURL('image/jpeg');
      const base64Data = cleanImageData.replace(/^data:image\/jpeg;base64,/, '');
      await fs.writeFile(outputPath, Buffer.from(base64Data, 'base64'));

      console.log(`Image processed successfully: ${outputPath}`);
    });
  } catch (error) {
    console.error('Error processing image:', error);
    process.exit(1);
  }
};

yargs(hideBin(process.argv))
  .command('remove <input> [output]', 'Remove metadata from image', (yargs) => {
    return yargs
      .positional('input', {
        describe: 'Input image path',
        type: 'string',
      })
      .positional('output', {
        describe: 'Output image path',
        type: 'string',
      });
  }, async (argv) => {
    const outputPath = argv.output || `clean_${path.basename(argv.input)}`;
    await processImage(argv.input, outputPath, 'remove');
  })
  .command('encrypt <input> [output]', 'Remove and encrypt metadata', (yargs) => {
    return yargs
      .positional('input', {
        describe: 'Input image path',
        type: 'string',
      })
      .positional('output', {
        describe: 'Output image path',
        type: 'string',
      })
      .option('password', {
        alias: 'p',
        type: 'string',
        describe: 'Password for encryption',
        demandOption: true,
      });
  }, async (argv) => {
    const outputPath = argv.output || `clean_${path.basename(argv.input)}`;
    await processImage(argv.input, outputPath, 'encrypt', argv.password);
  })
  .command('decrypt <input>', 'Decrypt metadata', (yargs) => {
    return yargs
      .positional('input', {
        describe: 'Input metadata file path',
        type: 'string',
      })
      .option('password', {
        alias: 'p',
        type: 'string',
        describe: 'Password for decryption',
        demandOption: true,
      });
  }, async (argv) => {
    await processImage(argv.input, '', 'decrypt', argv.password);
  })
  .demandCommand()
  .help()
  .argv;