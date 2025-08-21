import express, { Request, Response } from 'express';

const app = express();
const PORT = process.env.PORT || {{PUERTO}};

// Middleware
app.use(express.json());


// Rutas
app.get('/', (req: Request, res: Response) => {
  res.json({
    mensaje: '🚀 Servidor Express con TypeScript funcionando!',
   
  });
});


// Manejo de rutas no encontradas
app.use('*', (req: Request, res: Response) => {
  res.status(404).json({ error: 'Ruta no encontrada' });
});


app.listen(PORT, () => {
  console.log(`🚀 Servidor corriendo en http://localhost:${PORT}`);
  
});