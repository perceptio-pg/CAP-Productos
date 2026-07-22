namespace com.logali;

// Data persistencia
entity Products {
    key ID              : UUID;
        Name            : String;
        Description     : String;
        ImageUrl        : String;
        ReleaseDate     : DateTime;
        DiscotinuedDate : DateTime;
        Price           : Decimal(16, 2);
        Height          : Decimal(16, 2);
        Width           : Decimal(16, 2);
        Depth           : Decimal(16, 2);
        Quantity        : Decimal(16, 2);
        Supplier_Id     : UUID;
        ToSupplier        : Association to one Supplier on ToSupplier.ID = Supplier_Id;
};

entity Supplier {
    key ID         : UUID;
        Name       : String;
        Street     : String;
        City       : String;
        State      : String(2);
        PostalCode : String(5);
        Country    : String(3);
        Email      : String;
        Phone      : String;
        Fax        : String;
};

entity Category {
    key ID   : String(1);
        Name : String;
};

entity StockAvailability {
    key ID          : Integer;
        Description : String;
};

entity Currencies {
    key ID          : String(3);
        Description : String;
}

entity UnitOfMeasures {
    key ID          : String(2);
        Description : String;
};

entity DimensionUnits {
    key ID          : String(2);
        Description : String;
};

entity Months {
    key ID               : String(2);
        Description      : String;
        ShortDescription : String(3);
};

entity SalesData {
    key ID           : UUID;
        DeliveryDate : DateTime;
        Revenue      : Decimal(16, 2);
}

// Vistas de seleccion - permite hacer operaciones SQL
entity SelProducts as select from Products;

entity SelProducts1 as
    select from Products {
        *
    };

entity SelProducts2 as
    select from Products {
        Name,
        Price,
        Quantity
    };

   /* entity SelProducts3 as
    select from Products
    left join ProductReview
        on Products.Name = ProductReview.Name
    {
        Rating,
        Products.Name,
        sum(
            Price
        ) as TotalPrice
    }
    group by
        Rating,
        Products.Name
    order by
        Rating; */

// Vistas de proyeccion
entity ProjProducts as projection on Products;

entity ProjProducts2 as projection on Products {
    *
};

entity ProjProducts3 as projection on Products {
    ReleaseDate,
    Name
};

// Entidades con parametros
/*entity ParamProducts(pName : String) as
    select from Products {
        Name,
        Price,
        Quantity
    }
    where
        Name = :pName;

entity ProjParamProducts(pName : String)
    as projection on Products
    where Name = :pName;*/

// Ampliacion de entidades
extend Products with {
    PriceCondition     : String(2);
    PriceDetermination : String(3);
};