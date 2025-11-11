from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Literal

class PoderCreate(BaseModel):
    finalidad: Literal["personal", "medicinal", "cientifico"]
    vigencia: Literal["fijo", "indefinido"] = "fijo"
    fecha_inicio: str
    fecha_termino: Optional[str] = None
    cantidad_plantas: Optional[int] = None
    declaracion: str

    cedente_nombre: str
    cedente_rut: str
    cedente_domicilio: str
    cedente_email: EmailStr

    cesionario_nombre: str
    cesionario_rut: str
    cesionario_domicilio: str
    cesionario_email: EmailStr

    direccion_cultivo: str
    comuna_region: str

    # Firmas en dataURL opcionalmente (firma electrónica simple)
    firma_cedente: Optional[str] = None
    firma_cesionario: Optional[str] = None

class Poder(BaseModel):
    id: int
    status: str = "draft"  # draft | sent_to_sign | signed | rejected | cancelled
    provider: Optional[str] = None
    provider_envelope_id: Optional[str] = None
